import { useState } from "react";
import { z } from "zod";
import { http } from "@/lib/http";
import {
  Mail,
  User,
  Phone,
  MessageSquare,
  Tag,
  Send,
  CheckCircle,
  AlertCircle,
  MapPin,
  Clock,
} from "lucide-react";

// ─── Schema de validación ─────────────────────────────────────────────────────
const contactSchema = z.object({
  nombre: z.string().min(2, "El nombre debe tener al menos 2 caracteres."),
  email: z.string().min(1, "El email es requerido.").email("Ingresa un email válido."),
  telefono: z.string().optional(),
  asunto: z.string().min(3, "El asunto debe tener al menos 3 caracteres."),
  mensaje: z.string().min(10, "El mensaje debe tener al menos 10 caracteres."),
});

type ContactFormData = z.infer<typeof contactSchema>;
type FieldErrors = Partial<Record<keyof ContactFormData, string>>;

// ─── Componente InputField ─────────────────────────────────────────────────────
function InputField({
  icon: Icon,
  label,
  name,
  value,
  onChange,
  placeholder,
  type = "text",
  error,
  required = false,
}: {
  icon: React.ElementType;
  label: string;
  name: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  type?: string;
  error?: string;
  required?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="flex items-center gap-1.5 text-sm font-medium text-custom-dark-green">
        {label}
        {required && <span className="text-custom-red">*</span>}
      </label>
      <div className="relative">
        <Icon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-custom-medium-green" />
        <input
          type={type}
          name={name}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full rounded-xl border bg-white/70 py-3 pl-10 pr-4 text-sm text-custom-black placeholder-gray-400 backdrop-blur-sm transition-all focus:outline-none focus:ring-2 focus:ring-custom-medium-green/50 ${
            error
              ? "border-custom-red/60 focus:ring-custom-red/30"
              : "border-gray-200 hover:border-custom-medium-green/40"
          }`}
        />
      </div>
      {error && (
        <p className="flex items-center gap-1 text-xs text-custom-red">
          <AlertCircle className="h-3 w-3" />
          {error}
        </p>
      )}
    </div>
  );
}

// ─── Componente principal ──────────────────────────────────────────────────────
export default function ContactForm() {
  const [form, setForm] = useState<ContactFormData>({
    nombre: "",
    email: "",
    telefono: "",
    asunto: "",
    mensaje: "",
  });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [serverError, setServerError] = useState("");

  const update = (field: keyof ContactFormData) => (value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError("");

    const result = contactSchema.safeParse(form);
    if (!result.success) {
      const fieldErrors: FieldErrors = {};
      result.error.errors.forEach((err) => {
        const field = err.path[0] as keyof ContactFormData;
        if (!fieldErrors[field]) fieldErrors[field] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);
    try {
      await http("/api/contacto/", {
        method: "POST",
        body: JSON.stringify(form),
      });
      setSuccess(true);
      setForm({ nombre: "", email: "", telefono: "", asunto: "", mensaje: "" });
    } catch {
      setServerError("Hubo un error al enviar el mensaje. Intenta de nuevo más tarde.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center gap-5 rounded-2xl border border-custom-medium-green/20 bg-white/60 p-10 text-center backdrop-blur-sm">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-custom-light-green/20">
          <CheckCircle className="h-8 w-8 text-custom-dark-green" />
        </div>
        <div>
          <h3 className="text-xl font-semibold text-custom-dark-green">
            ¡Mensaje enviado!
          </h3>
          <p className="mt-1.5 text-sm text-gray-500">
            Gracias por contactarnos. Te responderemos pronto.
          </p>
        </div>
        <button
          onClick={() => setSuccess(false)}
          className="btn-primary rounded-xl px-6 py-2.5 text-sm font-medium"
        >
          Enviar otro mensaje
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
      {/* Nombre + Email */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <InputField
          icon={User}
          label="Nombre completo"
          name="nombre"
          value={form.nombre}
          onChange={update("nombre")}
          placeholder="Tu nombre"
          required
          error={errors.nombre}
        />
        <InputField
          icon={Mail}
          label="Correo electrónico"
          name="email"
          value={form.email}
          onChange={update("email")}
          placeholder="tu@email.com"
          type="email"
          required
          error={errors.email}
        />
      </div>

      {/* Teléfono + Asunto */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <InputField
          icon={Phone}
          label="Teléfono"
          name="telefono"
          value={form.telefono ?? ""}
          onChange={update("telefono")}
          placeholder="+57 300 000 0000"
          type="tel"
          error={errors.telefono}
        />
        <InputField
          icon={Tag}
          label="Asunto"
          name="asunto"
          value={form.asunto}
          onChange={update("asunto")}
          placeholder="¿En qué te podemos ayudar?"
          required
          error={errors.asunto}
        />
      </div>

      {/* Mensaje */}
      <div className="flex flex-col gap-1.5">
        <label className="flex items-center gap-1.5 text-sm font-medium text-custom-dark-green">
          <MessageSquare className="h-4 w-4 text-custom-medium-green" />
          Mensaje
          <span className="text-custom-red">*</span>
        </label>
        <textarea
          name="mensaje"
          value={form.mensaje}
          onChange={(e) => update("mensaje")(e.target.value)}
          placeholder="Cuéntanos con detalle tu consulta, pedido especial o propuesta..."
          rows={5}
          maxLength={1000}
          className={`w-full resize-none rounded-xl border bg-white/70 px-4 py-3 text-sm text-custom-black placeholder-gray-400 backdrop-blur-sm transition-all focus:outline-none focus:ring-2 focus:ring-custom-medium-green/50 ${
            errors.mensaje
              ? "border-custom-red/60 focus:ring-custom-red/30"
              : "border-gray-200 hover:border-custom-medium-green/40"
          }`}
        />
        <div className="flex items-center justify-between">
          {errors.mensaje ? (
            <p className="flex items-center gap-1 text-xs text-custom-red">
              <AlertCircle className="h-3 w-3" />
              {errors.mensaje}
            </p>
          ) : (
            <span />
          )}
          <span className="text-xs text-gray-400">{form.mensaje.length}/1000</span>
        </div>
      </div>

      {/* Error del servidor */}
      {serverError && (
        <div className="flex items-center gap-2 rounded-xl border border-custom-red/20 bg-custom-red/10 px-4 py-3 text-sm text-custom-red">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {serverError}
        </div>
      )}

      {/* Botón enviar */}
      <button
        type="submit"
        disabled={loading}
        className="btn-primary flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:px-10 sm:self-end"
      >
        {loading ? (
          <>
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            Enviando...
          </>
        ) : (
          <>
            <Send className="h-4 w-4" />
            Enviar mensaje
          </>
        )}
      </button>
    </form>
  );
}
