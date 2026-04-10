"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  MapPin,
  Image as ImageIcon,
  Spinner as Loader2,
  CloudArrowUp,
} from "@phosphor-icons/react"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"

type Dictionary = {
  title: string
  description: string
  formTitle: string
  formTitlePlaceholder: string
  formDescription: string
  formDescriptionPlaceholder: string
  formPhotos: string
  formLocation: string
  detectLocation: string
  submitting: string
  submitBtn: string
  success: string
  error: string
  validationLocation: string
  validationTitle: string
  locationDetected: string
  locationHelper: string
  detectGps: string
  uploadProof: string
  uploadHelper: string
  selectFiles: string
  geoNotSupported: string
  geoError: string
}

export function SubmitConcernForm({
  dictionary: t,
}: {
  dictionary: Dictionary
}) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(
    null
  )

  const handleDetectLocation = () => {
    if (!("geolocation" in navigator)) {
      alert(t.geoNotSupported)
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        })
      },
      (error) => {
        console.error("Error getting location", error)
        alert(t.geoError)
      }
    )
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Mock API call
    setTimeout(() => {
      setIsSubmitting(false)
      // alert(t.success)
      router.push("/concerns")
      router.refresh()
    }, 1500)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="title">{t.formTitle}</Label>
        <Input
          id="title"
          name="title"
          placeholder={t.formTitlePlaceholder}
          required
          minLength={5}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">{t.formDescription}</Label>
        <Textarea
          id="description"
          name="description"
          placeholder={t.formDescriptionPlaceholder}
          required
          className="min-h-[120px]"
        />
      </div>

      <div className="space-y-2">
        <Label>{t.formLocation}</Label>
        <Empty className="w-full border-2 border-dashed p-6 text-center">
          <EmptyHeader className="space-y-2">
            <EmptyMedia
              variant="icon"
              className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-muted"
            >
              <MapPin
                className="h-8 w-8 text-muted-foreground"
                weight={location ? "fill" : "regular"}
              />
            </EmptyMedia>
            <EmptyTitle>
              {location ? t.locationDetected : t.detectLocation}
            </EmptyTitle>
            <EmptyDescription>
              {location && (
                <span className="font-mono text-xs text-muted-foreground">
                  {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                </span>
              )}
              {!location && t.locationHelper}
            </EmptyDescription>
          </EmptyHeader>
          {!location && (
            <EmptyContent className="mt-4">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleDetectLocation}
              >
                {t.detectGps}
              </Button>
            </EmptyContent>
          )}
        </Empty>
      </div>

      <div className="space-y-2">
        <Label>{t.formPhotos}</Label>
        <Empty className="w-full border-2 border-dashed p-6 text-center">
          <EmptyHeader className="space-y-2">
            <EmptyMedia
              variant="icon"
              className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-muted"
            >
              <CloudArrowUp className="h-8 w-8 text-muted-foreground" />
            </EmptyMedia>
            <EmptyTitle>{t.uploadProof}</EmptyTitle>
            <EmptyDescription>
              {t.uploadHelper}
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent className="mt-4">
            <Button type="button" variant="outline" size="sm">
              <ImageIcon className="mr-2 h-4 w-4" />
              {t.selectFiles}
            </Button>
          </EmptyContent>
        </Empty>
      </div>

      <Button
        type="submit"
        disabled={isSubmitting || !location}
        className="h-11 w-full text-base font-semibold"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {t.submitting}
          </>
        ) : (
          t.submitBtn
        )}
      </Button>
    </form>
  )
}
