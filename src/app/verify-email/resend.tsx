"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function ResendActivation({ email }: { email: string }) {
  const [status, setStatus] = useState<"idle"|"sending"|"sent"|"error">("idle");
  const [message, setMessage] = useState("");

  async function handleResend() {
    setStatus("sending");
    setMessage("");
    try {
      const res = await fetch("/api/send-verification-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });
      if (res.ok) {
        setStatus("sent");
        setMessage("Enlace de activación reenviado. Revisa tu correo.");
      } else {
        setStatus("error");
        setMessage("No se pudo reenviar el enlace. Intenta más tarde.");
      }
    } catch {
      setStatus("error");
      setMessage("Error de red. Intenta más tarde.");
    }
  }

  return (
    <div className="flex flex-col items-center mt-4">
      <Button onClick={handleResend} disabled={status==="sending" || status==="sent"} className="bg-blue8 hover:bg-blue6 text-white font-body w-full max-w-xs">
        {status === "sending" ? "Enviando..." : status === "sent" ? "Enviado" : "Reenviar enlace de activación"}
      </Button>
      {message && <div className="text-sm mt-2 text-center text-blue1">{message}</div>}
    </div>
  );
}
