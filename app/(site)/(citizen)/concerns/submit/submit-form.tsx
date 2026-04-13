"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
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
import { createBrowserConcern } from "@/lib/concerns/client-store"

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
  const [locationLabel, setLocationLabel] = useState<string | null>(null)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [photoCount, setPhotoCount] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const handleDetectLocation = () => {
    if (!("geolocation" in navigator)) {
      toast.error(t.geoNotSupported)
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        })
        setLocationLabel(
          `${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}`
        )
      },
      (error) => {
        console.error("Error getting location", error)
        toast.error(t.geoError)
      }
    )
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)

    if (!location) {
      setError(t.validationLocation)
      return
    }

    if (title.trim().length < 5) {
      setError(t.validationTitle)
      return
    }

    setIsSubmitting(true)

    const concern = createBrowserConcern({
      title,
      description,
      location: {
        ...location,
        address: locationLabel ?? undefined,
      },
      photos:
        photoCount > 0
          ? Array.from({ length: photoCount }, (_, index) =>
              `https://placehold.co/600x400/png?text=Evidence+${index + 1}`
            )
          : [],
    })

    toast.success(t.success)
    setIsSubmitting(false)
    router.push(`/concerns/${concern.id}`)
    router.refresh()
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
          value={title}
          onChange={(event) => setTitle(event.target.value)}
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
          value={description}
          onChange={(event) => setDescription(event.target.value)}
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
                  {locationLabel}
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
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setPhotoCount((count) => Math.min(3, count + 1))}
            >
              <ImageIcon className="mr-2 h-4 w-4" />
              {t.selectFiles}
            </Button>
          </EmptyContent>
        </Empty>
      </div>

      {photoCount > 0 && (
        <p className="text-sm text-muted-foreground">
          {photoCount} / 3 photos staged for upload.
        </p>
      )}

      {error && <p className="text-sm font-medium text-destructive">{error}</p>}

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
