"use client";
import { useEffect } from "react";
import { clearCart } from "@/stores/cart";

export default function PaymentConfirmation() {
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const state = urlParams.get('transactionState') || urlParams.get('state_pol');
    
    if (state === "APPROVED" || state === "4") {
      localStorage.removeItem('cart-v1');
      
      clearCart();
      
      console.log('Carrito limpiado exitosamente');
    }
  }, []);

  return null;
}