"""Précalcul de l'éclairage de la maquette dans Blender (Cycles).

Entrée : scene.json exporté depuis la page (?bakeexport, voir tools/bake/README.md).
Sortie : un dossier de passes EXR (ciel, rebond du soleil, éclairages intérieurs) et uv1.bin,
combinés ensuite par combine.py en assets/bake/.

Usage : python bake_blender.py scene.json HDR OUT_DIR [RES] [SAMPLES]
"""
import base64, json, math, sys, os, time
import numpy as np
import bpy, bmesh
from mathutils import Vector

src, hdr, out = sys.argv[1], sys.argv[2], sys.argv[3]
RES = int(sys.argv[4]) if len(sys.argv) > 4 else 2048
SPP = int(sys.argv[5]) if len(sys.argv) > 5 else 64
os.makedirs(out, exist_ok=True)
D = json.load(open(src))

def f32(s): return np.frombuffer(base64.b64decode(s), dtype=np.float32)
def conv(a):  # three (y en haut) -> Blender (z en haut)
    a = a.reshape(-1, 3); return np.stack([a[:, 0], -a[:, 2], a[:, 1]], 1)

bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene

def build(items, name, with_mid):
    P, N, C, E, F, MID = [], [], [], [], [], []
    off = 0; ranges = []
    for i, it in enumerate(items):
        p = conv(f32(it['p'])); n = len(p)
        P.append(p); C.append(f32(it['c']).reshape(-1, 3)); E.append(f32(it['e']))
        t = np.arange(off, off + n).reshape(-1, 3)
        if it['flip']: t = t[:, [0, 2, 1]]
        F.append(t); MID.append(np.full(len(t), i)); ranges.append([off, n]); off += n
    P = np.concatenate(P); F = np.concatenate(F); C = np.concatenate(C); E = np.concatenate(E); MID = np.concatenate(MID)
    me = bpy.data.meshes.new(name)
    me.vertices.add(len(P)); me.vertices.foreach_set('co', P.ravel())
    me.loops.add(F.size); me.loops.foreach_set('vertex_index', F.ravel())
    me.polygons.add(len(F)); me.polygons.foreach_set('loop_start', np.arange(0, F.size, 3)); me.polygons.foreach_set('loop_total', np.full(len(F), 3))
    me.update(calc_edges=True); me.validate(clean_customdata=False)
    vi = F.ravel()
    ca = me.color_attributes.new('alb', 'FLOAT_COLOR', 'CORNER')
    ca.data.foreach_set('color', np.concatenate([C[vi], np.ones((len(vi), 1))], 1).astype(np.float32).ravel())
    ea = me.attributes.new('em', 'FLOAT', 'CORNER'); ea.data.foreach_set('value', E[vi].astype(np.float32))
    if with_mid:
        ma = me.attributes.new('mid', 'INT', 'FACE'); ma.data.foreach_set('value', MID.astype(np.int32))
    ob = bpy.data.objects.new(name, me); sc.collection.objects.link(ob)
    return ob, ranges, F, MID

t0 = time.time()
rec, ranges, F, MID = build(D['receivers'], 'rec', True)
occ, _, _, _ = build(D['occluders'], 'occ', False)
for p in rec.data.polygons: p.use_smooth = False
print('meshes', len(rec.data.polygons), len(occ.data.polygons), round(time.time() - t0, 1), 's', flush=True)

# --------------------------------------------------------------- UV de lightmap
bpy.context.view_layer.objects.active = rec; rec.select_set(True)
uvl = rec.data.uv_layers.new(name='lm'); rec.data.uv_layers.active = uvl
bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.select_all(action='SELECT')
bpy.ops.uv.smart_project(angle_limit=math.radians(60), island_margin=0.0, area_weight=0.0, scale_to_bounds=False)
bpy.ops.object.mode_set(mode='OBJECT')
# densité de texels : les grandes surfaces (terrain, cour) reçoivent moins de résolution que l'intérieur
me = rec.data; uvl = me.uv_layers['lm']
area = np.zeros(len(D['receivers']))
pa = np.zeros(len(me.polygons)); me.polygons.foreach_get('area', pa)
np.add.at(area, MID, pa)
uv = np.zeros(len(me.loops) * 2); uvl.data.foreach_get('uv', uv); uv = uv.reshape(-1, 2)
CAP = 120.0
for i, a in enumerate(area):
    if a <= CAP: continue
    k = math.sqrt(CAP / a) ** 0.6  # réduction douce
    li = np.where(np.repeat(MID == i, 3))[0]
    c = uv[li].mean(0); uv[li] = c + (uv[li] - c) * k
uvl.data.foreach_set('uv', uv.ravel())
bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.select_all(action='SELECT')
bpy.ops.uv.select_all(action='SELECT')
bpy.ops.uv.pack_islands(rotate=True, margin=0.0015 * 2048 / RES, scale=True)
bpy.ops.object.mode_set(mode='OBJECT')
me = rec.data; uvl = me.uv_layers['lm']
uv = np.zeros(len(me.loops) * 2); uvl.data.foreach_get('uv', uv); uv = uv.reshape(-1, 2)
# coin (0,0) réservé (valeur neutre pour les maillages non cuits) : marge de 8 texels
pad = 8 / RES
uv = pad + uv * (1 - pad); uvl.data.foreach_set('uv', uv.ravel())
# uv1 par sommet d'origine (chaque triangle a ses propres sommets)
vi = np.zeros(len(me.loops), dtype=np.int64); me.loops.foreach_get('vertex_index', vi)
per = np.zeros((len(me.vertices), 2), np.float32); per[vi] = uv
per.tofile(os.path.join(out, 'uv1.bin'))
json.dump({'count': len(ranges), 'ranges': ranges, 'res': RES}, open(os.path.join(out, 'uv.json'), 'w'))
print('uv ok', round(time.time() - t0, 1), 's', flush=True)

# --------------------------------------------------------------- matériaux (albédo par sommet, émission)
def mat_for(ob):
    m = bpy.data.materials.new(ob.name); m.use_nodes = True
    nt = m.node_tree; nt.nodes.clear()
    o = nt.nodes.new('ShaderNodeOutputMaterial')
    d = nt.nodes.new('ShaderNodeBsdfDiffuse')
    ca = nt.nodes.new('ShaderNodeVertexColor'); ca.layer_name = 'alb'
    at = nt.nodes.new('ShaderNodeAttribute'); at.attribute_name = 'em'
    em = nt.nodes.new('ShaderNodeEmission'); em.inputs['Color'].default_value = (1, 0.97, 0.92, 1)
    add = nt.nodes.new('ShaderNodeAddShader')
    nt.links.new(ca.outputs['Color'], d.inputs['Color'])
    nt.links.new(at.outputs['Fac'], em.inputs['Strength'])
    nt.links.new(d.outputs[0], add.inputs[0]); nt.links.new(em.outputs[0], add.inputs[1])
    nt.links.new(add.outputs[0], o.inputs['Surface'])
    ob.data.materials.append(m)
    return m
mrec = mat_for(rec); mat_for(occ)
img = bpy.data.images.new('lm', RES, RES, float_buffer=True, alpha=False)
tn = mrec.node_tree.nodes.new('ShaderNodeTexImage'); tn.image = img
mrec.node_tree.nodes.active = tn

# --------------------------------------------------------------- monde et lumières
world = bpy.data.worlds.new('w'); sc.world = world; world.use_nodes = True
wn = world.node_tree; bg = wn.nodes['Background']
env = wn.nodes.new('ShaderNodeTexEnvironment'); env.image = bpy.data.images.load(hdr)
hsv = wn.nodes.new('ShaderNodeHueSaturation'); hsv.inputs['Saturation'].default_value = 0.25
wn.links.new(env.outputs['Color'], hsv.inputs['Color']); wn.links.new(hsv.outputs['Color'], bg.inputs['Color'])

def sun_lamp():
    d = conv(np.array(D['sun'], np.float32))[0]
    l = bpy.data.lights.new('sun', 'SUN'); l.energy = 1.0; l.angle = math.radians(1.2)
    o = bpy.data.objects.new('sun', l); sc.collection.objects.link(o)
    o.rotation_euler = Vector(d).to_track_quat('Z', 'Y').to_euler()
    return o
sun = sun_lamp()

groups = {}
def panels(name, x0, x1, y0, y1, z, step=3.2, size=(1.2, 0.3)):
    objs = []
    nx = max(1, round((x1 - x0) / step)); ny = max(1, round((y1 - y0) / step))
    for i in range(nx):
        for j in range(ny):
            l = bpy.data.lights.new(f'{name}{i}_{j}', 'AREA'); l.shape = 'RECTANGLE'; l.size, l.size_y = size; l.energy = 1.0
            o = bpy.data.objects.new(l.name, l); o.location = (x0 + (i + 0.5) * (x1 - x0) / nx, y0 + (j + 0.5) * (y1 - y0) / ny, z)
            sc.collection.objects.link(o); objs.append(o)
    groups[name] = objs
# coordonnées Blender : x = x monde, y = -z monde, z = hauteur. Bâtiment : x [-20, 20], z monde [-11, 11].
panels('atelier', -19.5, 9.5, -10.5, 10.5, 7.9)
panels('resto', 10.3, 19.7, -2.6, 10.7, 3.7, step=2.6)        # restauration (z monde -11..2.8)
panels('reception', 10.3, 19.7, -10.7, -3.2, 3.0, step=2.6)   # réception (z monde 3..11)
panels('base', -19.5, 19.5, -10.5, 10.5, -0.6, step=3.6)      # sous-sol
panels('wash', -26.3, -10.0, -56.2, -49.7, 4.8, step=3.2)      # lavage automatique (z monde 49,5..56,4)

# --------------------------------------------------------------- bakes
sc.render.engine = 'CYCLES'; sc.cycles.device = 'CPU'; sc.cycles.samples = SPP
sc.cycles.max_bounces = 4; sc.cycles.diffuse_bounces = 3; sc.cycles.glossy_bounces = 0; sc.cycles.transmission_bounces = 0
sc.render.bake.margin = 6; sc.render.bake.use_clear = True
for o in sc.objects: o.select_set(False)
rec.select_set(True); bpy.context.view_layer.objects.active = rec

def set_scene(world_on, sun_on, group):
    bg.inputs['Strength'].default_value = 0.6 if world_on else 0.0
    sun.hide_render = not sun_on
    for g, objs in groups.items():
        for o in objs: o.hide_render = g != group
    # émissions (néons, enseignes) avec le ciel uniquement
    at_strength = 1.0 if world_on else 0.0
    for m in (mrec, bpy.data.materials['occ']):
        m.node_tree.nodes['Emission'].inputs['Color'].default_value = (at_strength, at_strength * 0.97, at_strength * 0.92, 1)

def bake(tag, filt):
    t = time.time()
    bpy.ops.object.bake(type='DIFFUSE', pass_filter=filt, margin=6, use_clear=True)
    a = np.zeros(RES * RES * 4, np.float32); img.pixels.foreach_get(a)
    np.save(os.path.join(out, tag + '.npy'), a.reshape(RES, RES, 4)[:, :, :3])
    print('bake', tag, round(time.time() - t, 1), 's', flush=True)

passes = sys.argv[6].split(',') if len(sys.argv) > 6 else ['sky', 'sun', 'atelier', 'resto', 'reception', 'base', 'wash']
for p in passes:
    if p == 'sky': set_scene(True, False, None); bake('sky', {'DIRECT', 'INDIRECT'})
    elif p == 'sun': set_scene(False, True, None); bake('sun', {'INDIRECT'})
    elif p == 'sundirect': set_scene(False, True, None); bake('sundirect', {'DIRECT'})
    else: set_scene(False, False, p); bake(p, {'DIRECT', 'INDIRECT'})
print('total', round(time.time() - t0, 1), 's')
