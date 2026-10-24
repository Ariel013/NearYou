"use client";

// Éléments DOM des marqueurs MapLibre. Le style vit dans globals.css
// (.ny-pin, .ny-user, .ny-dest) : MapLibre pose son propre `transform` sur
// l'élément racine, on n'y touche donc jamais.

export interface ProviderPinOptions {
  name: string;
  isSelected?: boolean;
  onClick?: () => void;
}

export function createProviderPin({ name, isSelected = false, onClick }: ProviderPinOptions): HTMLElement {
  const root = document.createElement("button");
  root.type = "button";
  root.className = "ny-pin";
  root.dataset.selected = String(isSelected);
  root.setAttribute("aria-label", isSelected ? `${name}, sélectionné` : name);

  const head = document.createElement("span");
  head.className = "ny-pin__head";
  const initial = document.createElement("span");
  initial.className = "ny-pin__initial";
  initial.textContent = name.slice(0, 1).toUpperCase();
  head.appendChild(initial);
  root.appendChild(head);

  if (isSelected) {
    const label = document.createElement("span");
    label.className = "ny-pin__label";
    label.textContent = name;
    root.appendChild(label);
  }

  if (onClick) {
    root.addEventListener("click", (e) => {
      e.stopPropagation();
      onClick();
    });
  }
  return root;
}

export function createUserDot(heading: number | null = null): HTMLElement {
  const root = document.createElement("div");
  root.className = "ny-user";
  root.setAttribute("aria-label", "Votre position");
  root.setAttribute("role", "img");
  if (heading !== null) {
    const cone = document.createElement("span");
    cone.className = "ny-user__cone";
    cone.style.rotate = `${heading}deg`;
    root.appendChild(cone);
  }
  const dot = document.createElement("span");
  dot.className = "ny-user__dot";
  root.appendChild(dot);
  return root;
}

export function setUserDotHeading(root: HTMLElement, heading: number | null) {
  let cone = root.querySelector<HTMLElement>(".ny-user__cone");
  if (heading === null) {
    cone?.remove();
    return;
  }
  if (!cone) {
    cone = document.createElement("span");
    cone.className = "ny-user__cone";
    root.prepend(cone);
  }
  cone.style.rotate = `${heading}deg`;
}

/** Épingle de destination ou de position à choisir (déplaçable). */
export function createDestinationPin(label?: string): HTMLElement {
  const root = document.createElement("div");
  root.className = "ny-dest";
  const head = document.createElement("span");
  head.className = "ny-dest__head";
  root.appendChild(head);
  if (label) {
    const tag = document.createElement("span");
    tag.className = "ny-pin__label";
    tag.textContent = label;
    root.appendChild(tag);
  }
  return root;
}
