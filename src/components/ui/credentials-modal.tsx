"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Copy, Check, Eye, EyeOff } from "lucide-react";

interface CredentialsModalProps {
  isOpen: boolean;
  onClose: () => void;
  email: string;
  password: string;
  employeeName: string;
}

export default function CredentialsModal({ 
  isOpen, 
  onClose, 
  email, 
  password, 
  employeeName 
}: CredentialsModalProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  if (!isOpen) return null;

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center text-green-600">
            ✅ Empleado Creado Exitosamente
          </CardTitle>
          <CardDescription className="text-center">
            Credenciales temporales para <strong>{employeeName}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-sm text-yellow-800">
              <strong>Importante:</strong> El empleado debe cambiar su contraseña en el primer login.
            </p>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={email}
                  readOnly
                  className="flex-1 p-2 border border-gray-300 rounded-md bg-gray-50 text-sm"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyToClipboard(email, 'email')}
                  className="px-3"
                >
                  {copiedField === 'email' ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contraseña Temporal
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  readOnly
                  className="flex-1 p-2 border border-gray-300 rounded-md bg-gray-50 text-sm"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowPassword(!showPassword)}
                  className="px-3"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyToClipboard(password, 'password')}
                  className="px-3"
                >
                  {copiedField === 'password' ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-800">
              <strong>Instrucciones para el empleado:</strong>
            </p>
            <ul className="text-sm text-blue-700 mt-1 space-y-1">
              <li>• Ve a <strong>/login-employee</strong></li>
              <li>• Usa estas credenciales para acceder</li>
              <li>• Cambia tu contraseña en el primer login</li>
            </ul>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={onClose}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            >
              Entendido
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
