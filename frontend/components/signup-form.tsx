"use client"

import React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Eye, EyeOff, Loader2 } from "lucide-react"
import Link from "next/link"

export function SignupForm({ onSwitchToSignin }: { onSwitchToSignin?: () => void }) {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    agreeTerms: false,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000))
    setIsLoading(false)
    console.log("[v0] Form submitted:", formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="space-y-1 lg:space-y-1.5">
        <Label htmlFor="fullName" className="text-foreground font-medium text-sm">
          Nama Lengkap
        </Label>
        <Input
          id="fullName"
          type="text"
          placeholder="Masukkan nama lengkap"
          value={formData.fullName}
          onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
          required
          className="h-10 bg-card border-border focus:border-primary focus:ring-primary"
        />
      </div>

      <div className="space-y-1 lg:space-y-1.5">
        <Label htmlFor="email" className="text-foreground font-medium text-sm">
          Email
        </Label>
        <Input
          id="email"
          type="email"
          placeholder="contoh@email.com"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          required
          className="h-10 bg-card border-border focus:border-primary focus:ring-primary"
        />
      </div>

      <div className="space-y-1 lg:space-y-1.5">
        <Label htmlFor="phone" className="text-foreground font-medium text-sm">
          Nomor Telepon
        </Label>
        <Input
          id="phone"
          type="tel"
          placeholder="08xxxxxxxxxx"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          required
          className="h-10 bg-card border-border focus:border-primary focus:ring-primary"
        />
      </div>

      <div className="space-y-1 lg:space-y-1.5">
        <Label htmlFor="password" className="text-foreground font-medium text-sm">
          Kata Sandi
        </Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            placeholder="Minimal 8 karakter"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            required
            minLength={8}
            className="h-10 bg-card border-border focus:border-primary focus:ring-primary pr-10"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <div className="space-y-1 lg:space-y-1.5">
        <Label htmlFor="confirmPassword" className="text-foreground font-medium text-sm">
          Konfirmasi Kata Sandi
        </Label>
        <div className="relative">
          <Input
            id="confirmPassword"
            type={showConfirmPassword ? "text" : "password"}
            placeholder="Ulangi kata sandi"
            value={formData.confirmPassword}
            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
            required
            minLength={8}
            className="h-10 bg-card border-border focus:border-primary focus:ring-primary pr-10"
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            aria-label={showConfirmPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
          >
            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <div className="flex items-start space-x-3 pt-1">
        <Checkbox
          id="agreeTerms"
          checked={formData.agreeTerms}
          onCheckedChange={(checked) => setFormData({ ...formData, agreeTerms: checked as boolean })}
          className="mt-0.5 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
        />
        <Label htmlFor="agreeTerms" className="text-sm text-muted-foreground leading-relaxed cursor-pointer">
          Saya menyetujui{" "}
          <a href="#" className="text-primary hover:underline font-medium">
            Syarat & Ketentuan
          </a>{" "}
          serta{" "}
          <a href="#" className="text-primary hover:underline font-medium">
            Kebijakan Privasi
          </a>
        </Label>
      </div>

      <Button
        type="submit"
        disabled={isLoading || !formData.agreeTerms}
        className="w-full h-10 text-sm font-semibold bg-primary hover:bg-primary/90 text-primary-foreground transition-all"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Mendaftar...
          </>
        ) : (
          "Daftar Sekarang"
        )}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Sudah punya akun?{" "}
        <button 
          type="button"
          onClick={onSwitchToSignin}
          className="text-primary hover:underline font-semibold"
        >
          Masuk di sini
        </button>
      </p>
    </form>
  )
}
