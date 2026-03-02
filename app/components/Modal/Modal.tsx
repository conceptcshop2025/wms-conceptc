"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import "./Modal.css";

interface ModalProps {
  isOpen: boolean;
  title: string;
  message: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onClose: () => void;
}

export default function Modal({
  isOpen,
  title,
  message,
  confirmText = "Confirmer",
  cancelText = "Annuler",
  onConfirm,
  onClose,
}: ModalProps) {
  const [isClosing, setIsClosing] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Dispara animación de salida y luego llama al onClose del padre
  const close = useCallback(() => {
    setIsClosing(true);
    timerRef.current = setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 180); // debe coincidir con la duración de overlayOut / popupOut
  }, [onClose]);

  // Cancela el timer si el componente se desmonta antes de que termine
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  // Cierra con tecla Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, close]);

  // No renderiza nada cuando está cerrado y sin animación pendiente
  // → el estado interno se resetea automáticamente al reabrirse
  if (!isOpen && !isClosing) return null;

  return (
    <div
      className={`modal-overlay${isClosing ? " closing" : ""}`}
      ref={overlayRef}
      onClick={(e) => { if (e.target === overlayRef.current) close(); }}
    >
      <div className="modal-popup">
        <div className="modal-header">
          <h3 className="modal-title">{title}</h3>
        </div>
        <div className="modal-body">
          <div className="modal-message">{message}</div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={close}>
            {cancelText}
          </button>
          <button className="btn btn-primary" onClick={() => { onConfirm(); close(); }}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
