import { el } from "./utils.js";

let openCount = 0;

function updateScrollLock() {
  document.body.style.overflow = openCount > 0 ? "hidden" : "";
}

export class Modal {
  constructor() {
    this.isOpen = false;
    this.overlay = el("div", "modal-overlay");
    this.modal = el("div", "modal");
    this.content = el("div", "modal-content");

    this.modal.appendChild(this.content);
    this.overlay.appendChild(this.modal);
    document.body.appendChild(this.overlay);

    // Клик по фону
    this.overlay.addEventListener("click", (e) => {
      if (e.target === this.overlay) this.close();
    });

    // Escape
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && this.isOpen) this.close();
    });
  }

  setContent(node) {
    while (this.content.firstChild) {
      this.content.removeChild(this.content.firstChild);
    }
    this.content.appendChild(node);
  }

  open() {
    if (this.isOpen) return;
    this.isOpen = true;
    this.overlay.classList.add("visible");
    openCount++;
    updateScrollLock();
  }

  close() {
    if (!this.isOpen) return;
    this.isOpen = false;
    this.overlay.classList.remove("visible");
    openCount--;
    updateScrollLock();
  }
}
