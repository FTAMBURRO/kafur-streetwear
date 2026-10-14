"""Separa la persona del fondo del hero KAFUR (plan B: el depth map no
resuelve persona/muros/cielo) y reconstruye el fondo por inpainting.

Lee:    public/assets/hero-kafur.jpg
Escribe: public/assets/hero-persona.png  (RGBA, persona recortada)
         public/assets/hero-fondo.jpg     (fondo reconstruido, sin persona)

Modelo: u2net_human_seg vía rembg (se descarga solo la primera vez).
"""
import os
import sys

import cv2
import numpy as np
from PIL import Image
from rembg import new_session, remove

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SRC = os.path.join(ROOT, "public", "assets", "hero-kafur.jpg")
PERSONA = os.path.join(ROOT, "public", "assets", "hero-persona.png")
FONDO = os.path.join(ROOT, "public", "assets", "hero-fondo.jpg")


def main():
    img = Image.open(SRC).convert("RGB")
    w, h = img.size
    print("entrada:", w, "x", h)

    session = new_session("u2net_human_seg")
    cut = remove(img, session=session)
    alpha = np.asarray(cut)[:, :, 3].astype(np.float32) / 255.0
    coverage = float((alpha > 0.5).mean())
    print("cobertura máscara persona: %.1f%%" % (coverage * 100))
    if not 0.01 < coverage < 0.5:
        print("MÁSCARA NO CONVINCENTE, aborto sin escribir archivos")
        return 1

    ys, xs = np.where(alpha > 0.5)
    print(
        "bbox persona x:[%d,%d] y:[%d,%d] (centro x=%.2f)"
        % (xs.min(), xs.max(), ys.min(), ys.max(), (xs.min() + xs.max()) / 2 / w)
    )

    # Pluma suave de bordes para componer sin halo.
    soft = (np.clip(alpha, 0, 1) * 255).astype(np.uint8)
    soft = cv2.GaussianBlur(soft, (5, 5), 0)
    cut_soft = np.asarray(cut).copy()
    cut_soft[:, :, 3] = soft
    Image.fromarray(cut_soft).save(PERSONA)
    print("persona:", PERSONA)

    # Fondo: inpaint Telea sobre la máscara dilatada.
    hard = ((alpha > 0.5).astype(np.uint8)) * 255
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (15, 15))
    hole = cv2.dilate(hard, kernel, iterations=1)
    bgr = cv2.cvtColor(np.asarray(img), cv2.COLOR_RGB2BGR)
    filled = cv2.inpaint(bgr, hole, 6, cv2.INPAINT_TELEA)
    Image.fromarray(cv2.cvtColor(filled, cv2.COLOR_BGR2RGB)).save(FONDO, quality=88)
    print("fondo:", FONDO)
    return 0


if __name__ == "__main__":
    sys.exit(main())
