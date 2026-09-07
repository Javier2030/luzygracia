#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Camisetas cristianas estampadas — catálogo de producto terminado.

Ojo con la diferencia frente a `ropa_disenos.py`: aquella línea es diseño propio
que se estampa por encargo sobre la prenda que el cliente elija, con precio
calculado. Esto es otra cosa: camisetas YA ESTAMPADAS, fotografiadas de verdad,
a precio cerrado y con tallas de stock. Por eso vive en su propio archivo y su
propia página.

Datos que dio el dueño el 7-sep-2026:
  · Algodón licrado premium
  · $30.000 cada una, sin importar el diseño
  · Tallas S, M, L y XL

Las citas bíblicas van como el diseño las trae. Cuando el arte no la imprime,
aquí se deja en `cita` igualmente para el texto de la ficha y el buscador,
verificada en RVR1960: una camiseta con la cita cambiada se lee toda la vida.
"""

PRECIO = 30000
TALLAS = ["S", "M", "L", "XL"]
TELA = "Algodón licrado premium"

# (slug_foto, título, cita, colores, alto_web, [diseños que salen en la foto])
CAMISETAS = [
    ("jesus-esperanza-de-vida", "Jesús, esperanza de vida", "",
     ["Blanco"], 1200,
     ["Corazón y línea de electrocardiograma en rojo y negro"]),

    ("dios-es-mi-fuerza", "Dios es mi fuerza", "",
     ["Vinotinto", "Lila", "Café"], 1007,
     ["Letra en vinilo plateado con flor rosada"]),

    ("fe-mueve-montanas-poder-amo-primero", "La fe mueve montañas · En el nombre de Jesús hay poder · Dios me amó primero",
     "Mateo 17:20", ["Rosa", "Lila", "Amarillo"], 655,
     ["La fe puede mover montañas — Mateo 17:20",
      "En el nombre de Jesús hay poder",
      "¡Dios me amó primero!"]),

    ("deja-tu-angustia-vinotinto", "Deja tu angustia, ven a Mí que yo te daré descanso",
     "Mateo 11:28", ["Vinotinto"], 1066,
     ["Caligrafía con corazones y mano de corazón"]),

    ("espiritu-de-poder-amor-dominio", "Dios no te dio espíritu de cobardía, sino de poder, amor y dominio propio",
     "2 Timoteo 1:7", ["Blanco", "Rojo"], 978,
     ["Letra en vinilo escarchado con mariposas"]),

    ("fe-corazones", "Fe", "",
     ["Rosa", "Beige", "Blanco"], 716,
     ["La palabra «fe» trazada con flechas y corazones dorados"]),

    ("dios-va-conmigo", "Dios va conmigo dondequiera que voy", "",
     ["Lila", "Rosa", "Amarillo"], 883,
     ["Caligrafía con globos de corazón escarchados"]),

    ("todo-proceso-tiene-un-proposito", "Todo proceso tiene un propósito", "",
     ["Vinotinto", "Hueso", "Rojo"], 633,
     ["Oruga, capullo y mariposa en vinilo tornasol"]),

    ("deja-tu-angustia-colores", "Deja tu angustia, ven a Mí que yo te daré descanso",
     "Mateo 11:28", ["Amarillo", "Rosa", "Azul"], 612,
     ["La misma caligrafía, con «descanso» en dorado"]),

    ("todo-lo-puedo-biblia", "Todo lo puedo en Cristo que me fortalece",
     "Filipenses 4:13", ["Naranja", "Rojo", "Verde militar"], 955,
     ["Biblia abierta sobre fondo de color"]),

    ("solo-jesus-salva", "¡Sólo Jesús salva!", "Juan 14:6",
     ["Naranja", "Verde militar", "Azul marino"], 1007,
     ["Tipografía grande a dos tonos"]),

    ("con-dios-todo-es-mas-bonito", "Con Dios todo es más bonito", "",
     ["Amarillo"], 1200,
     ["Letras de colores con flores y corazones"]),

    ("todo-lo-puedo-paloma", "Todo lo puedo en Cristo que me fortalece",
     "Filipenses 4:13", ["Rojo", "Azul marino", "Beige"], 1200,
     ["Caligrafía clásica con paloma"]),

    ("tu-nombre-gozo-princesa", "Tu nombre está en las manos de Dios · El gozo del Señor es mi fuerza · Soy la princesa de papá Dios",
     "Nehemías 8:10", ["Turquesa", "Beige", "Amarillo"], 648,
     ["Tu nombre está en las manos de Dios",
      "El gozo del Señor es mi fuerza — Nehemías 8:10",
      "Soy la princesa de papá Dios"]),

    ("ya-no-soy-esclava-obra-maestra", "Ya no soy esclava del temor · Somos la obra maestra de Dios", "",
     ["Rosa", "Beige"], 767,
     ["Ya no soy esclava del temor, yo soy hija de Dios",
      "Somos la obra maestra de Dios"]),

    ("jesus-te-ama", "Jesús te ama", "",
     ["Blanco"], 1200,
     ["Letrero con cruz y corazones rojos"]),
]


def cop(v):
    return "$" + f"{v:,}".replace(",", ".")


def total_disenos():
    return sum(len(c[5]) for c in CAMISETAS)
