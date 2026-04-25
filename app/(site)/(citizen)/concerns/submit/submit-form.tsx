"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { AspectRatio } from "@/components/ui/aspect-ratio"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  MapPin,
  Image as ImageIcon,
  Spinner as Loader2,
  CloudArrowUp,
  X,
  Plus,
  NavigationArrow,
  CheckCircle,
  Warning,
  ArrowRight,
  ArrowLeft,
  FileText,
  Camera,
  PaperPlaneTilt,
} from "@phosphor-icons/react"
import { submitConcernAction } from "./actions"
import { supabase } from "@/lib/supabase"
import { CONCERN_CATEGORIES } from "@/lib/concerns/categories"
import { AiInsightPanel } from "@/components/ai/AiInsightPanel"

// ─── Bangladesh administrative data ───────────────────────────────────────────
const DIVISIONS = [
  "Dhaka", "Chattogram", "Rajshahi", "Khulna",
  "Barishal", "Sylhet", "Rangpur", "Mymensingh",
]

const DISTRICTS: Record<string, string[]> = {
  Dhaka: ["Dhaka", "Gazipur", "Narayanganj", "Narsingdi", "Manikganj", "Munshiganj", "Rajbari", "Faridpur", "Madaripur", "Shariatpur", "Gopalganj", "Kishoreganj", "Tangail"],
  Chattogram: ["Chattogram", "Cox's Bazar", "Feni", "Lakshmipur", "Noakhali", "Comilla", "Brahmanbaria", "Chandpur", "Khagrachhari", "Rangamati", "Bandarban"],
  Rajshahi: ["Rajshahi", "Natore", "Chapai Nawabganj", "Pabna", "Sirajganj", "Bogura", "Joypurhat", "Naogaon"],
  Khulna: ["Khulna", "Jessore", "Satkhira", "Bagerhat", "Jhenaidah", "Magura", "Narail", "Chuadanga", "Meherpur", "Kushtia"],
  Barishal: ["Barishal", "Bhola", "Patuakhali", "Pirojpur", "Jhalokati", "Barguna"],
  Sylhet: ["Sylhet", "Moulvibazar", "Habiganj", "Sunamganj"],
  Rangpur: ["Rangpur", "Dinajpur", "Gaibandha", "Kurigram", "Lalmonirhat", "Nilphamari", "Panchagarh", "Thakurgaon"],
  Mymensingh: ["Mymensingh", "Jamalpur", "Netrokona", "Sherpur"],
}


// ─── Step definitions ──────────────────────────────────────────────────────────
const STEPS = [
  { id: 1, label: "Details",  icon: FileText,          description: "What's the issue?" },
  { id: 2, label: "Location", icon: MapPin,             description: "Where is it?" },
  { id: 3, label: "Photos",   icon: Camera,             description: "Show evidence" },
  { id: 4, label: "Submit",   icon: PaperPlaneTilt,     description: "Review & send" },
] as const

type StepId = (typeof STEPS)[number]["id"]

// ─── Dictionary type ───────────────────────────────────────────────────────────
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

// ─── Milestone indicator ───────────────────────────────────────────────────────
function MilestoneProgress({
  currentStep,
  completedSteps,
}: {
  currentStep: StepId
  completedSteps: Set<StepId>
}) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between">
        {STEPS.map((step, idx) => {
          const Icon = step.icon
          const isCompleted = completedSteps.has(step.id)
          const isCurrent = currentStep === step.id
          const isUpcoming = !isCompleted && !isCurrent

          return (
            <div key={step.id} className="flex flex-1 items-center">
              <div className="flex flex-col items-center gap-1.5">
                {/* Node */}
                <div
                  className={`relative flex size-10 items-center justify-center rounded-full border-2 transition-all duration-300 ${
                    isCompleted
                      ? "border-primary bg-primary text-primary-foreground shadow-sm shadow-primary/30"
                      : isCurrent
                      ? "border-primary bg-primary/10 text-primary shadow-sm shadow-primary/20"
                      : "border-border bg-muted/50 text-muted-foreground"
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle className="size-5" weight="fill" />
                  ) : (
                    <Icon className="size-4" weight={isCurrent ? "fill" : "regular"} />
                  )}
                  {isCurrent && (
                    <span className="absolute -top-0.5 -right-0.5 size-3 rounded-full bg-primary ring-2 ring-background animate-pulse" />
                  )}
                </div>
                {/* Label */}
                <div className="text-center">
                  <p
                    className={`text-xs font-semibold transition-colors duration-200 ${
                      isCurrent
                        ? "text-primary"
                        : isCompleted
                        ? "text-foreground"
                        : "text-muted-foreground"
                    }`}
                  >
                    {step.label}
                  </p>
                </div>
              </div>

              {/* Connector line */}
              {idx < STEPS.length - 1 && (
                <div className="relative mx-2 h-0.5 flex-1 overflow-hidden rounded-full bg-border">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-500"
                    style={{
                      width: completedSteps.has(step.id) ? "100%" : "0%",
                    }}
                  />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Main component ────────────────────────────────────────────────────────────
export function SubmitConcernForm({ dictionary: t }: { dictionary: Dictionary }) {
  const router = useRouter()

  // Wizard state
  const [currentStep, setCurrentStep] = useState<StepId>(1)
  const [completedSteps, setCompletedSteps] = useState<Set<StepId>>(new Set())
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Step 1 – Details
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState("")

  // Step 2 – Location
  const [division, setDivision] = useState("")
  const [district, setDistrict] = useState("")
  const [thana, setThana] = useState("")
  const [area, setArea] = useState("")
  const [detailAddress, setDetailAddress] = useState("")
  const [gpsCoords, setGpsCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [gpsLoading, setGpsLoading] = useState(false)

  // Step 3 – Photos
  const [photos, setPhotos] = useState<{ file: File; preview: string }[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ── Derived ──────────────────────────────────────────────────────────────────
  const buildAddress = () =>
    [detailAddress, area, thana, district, division].filter(Boolean).join(", ")

  const step1Valid = title.trim().length >= 5
  const availableDistricts = division ? (DISTRICTS[division] ?? []) : []

  // ── Step navigation ───────────────────────────────────────────────────────────
  const goToStep = (step: StepId) => {
    setError(null)
    setCurrentStep(step)
  }

  const validateAndNext = () => {
    setError(null)
    if (currentStep === 1) {
      if (!step1Valid) { setError(t.validationTitle); return }
      setCompletedSteps((prev) => new Set([...prev, 1]))
      goToStep(2)
    } else if (currentStep === 2) {
      if (!division || !district) { setError("Please select Division and District."); return }
      if (!gpsCoords) { setError("Please capture GPS coordinates."); return }
      setCompletedSteps((prev) => new Set([...prev, 2]))
      goToStep(3)
    } else if (currentStep === 3) {
      setCompletedSteps((prev) => new Set([...prev, 3]))
      goToStep(4)
    }
  }

  const goBack = () => {
    setError(null)
    goToStep((currentStep - 1) as StepId)
  }

  // ── GPS ───────────────────────────────────────────────────────────────────────
  const handleDetectGps = () => {
    if (!("geolocation" in navigator)) { toast.error(t.geoNotSupported); return }
    setGpsLoading(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGpsCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setGpsLoading(false)
        toast.success("GPS coordinates captured!")
      },
      (err) => {
        console.error(err)
        setGpsLoading(false)
        toast.error(t.geoError)
      }
    )
  }

  // ── Photos ────────────────────────────────────────────────────────────────────
  const addFiles = (files: File[]) => {
    if (photos.length + files.length > 3) { toast.error("Up to 3 photos only."); return }
    setPhotos((prev) => [...prev, ...files.map((f) => ({ file: f, preview: URL.createObjectURL(f) }))].slice(0, 3))
  }
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) addFiles(Array.from(e.target.files))
  }
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true) }
  const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false) }
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const valid = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith("image/"))
    if (valid.length < e.dataTransfer.files.length) toast.error("Only image files are allowed.")
    addFiles(valid)
  }

  // ── Submit ────────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    setError(null)
    setIsSubmitting(true)
    try {
      const uploadedUrls: string[] = []
      for (const item of photos) {
        const ext = item.file.name.split(".").pop()
        const name = `${Math.random().toString(36).substring(2)}_${Date.now()}.${ext}`
        const { error: upErr } = await supabase.storage.from("concerns").upload(name, item.file)
        if (upErr) throw new Error(upErr.message)
        const { data } = supabase.storage.from("concerns").getPublicUrl(name)
        uploadedUrls.push(data.publicUrl)
      }
      const id = await submitConcernAction({
        title, description, category,
        locationLat: gpsCoords!.lat,
        locationLng: gpsCoords!.lng,
        address: buildAddress(),
        photos: uploadedUrls,
      })
      if (!id) {
        throw new Error("Concern saved but no tracking id was returned.")
      }
      toast.success(t.success)
      router.replace(`/concerns/${id}`)
      return
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : t.error)
    } finally {
      setIsSubmitting(false)
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-0">
      <MilestoneProgress currentStep={currentStep} completedSteps={completedSteps} />

      {/* ── Step panel ── */}
      <div className="min-h-[340px]">

        {/* Step 1: Details */}
        {currentStep === 1 && (
          <div className="space-y-5 animate-in fade-in-0 slide-in-from-right-4 duration-300">
            <div className="space-y-1 pb-2">
              <h2 className="text-lg font-semibold">Concern Details</h2>
              <p className="text-sm text-muted-foreground">Describe the civic issue you want to report.</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">
                Title <span className="text-destructive">*</span>
              </Label>
              <Input
                id="title"
                placeholder={t.formTitlePlaceholder}
                minLength={5}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="h-10"
              />
              <p className="text-xs text-muted-foreground">Min. 5 characters required.</p>
            </div>

            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={category} onValueChange={(v) => setCategory(v ?? "")}>
                <SelectTrigger className="h-10 w-full">
                  <SelectValue placeholder="Select a category...">
                    {category ? CONCERN_CATEGORIES.find((c) => c.value === category)?.label : undefined}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {CONCERN_CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">
                Description <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="description"
                placeholder={t.formDescriptionPlaceholder}
                className="min-h-[120px] resize-none"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>
        )}

        {/* Step 2: Location */}
        {currentStep === 2 && (
          <div className="space-y-5 animate-in fade-in-0 slide-in-from-right-4 duration-300">
            <div className="space-y-1 pb-2">
              <h2 className="text-lg font-semibold">Location</h2>
              <p className="text-sm text-muted-foreground">Specify where the issue is located.</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Division <span className="text-destructive">*</span></Label>
                <Select value={division} onValueChange={(v) => { setDivision(v ?? ""); setDistrict("") }}>
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Select division..." />
                  </SelectTrigger>
                  <SelectContent>
                    {DIVISIONS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>District <span className="text-destructive">*</span></Label>
                <Select value={district} onValueChange={(v) => setDistrict(v ?? "")} disabled={!division}>
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder={division ? "Select district..." : "Select division first"} />
                  </SelectTrigger>
                  <SelectContent>
                    {availableDistricts.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="thana">Upazila / Thana</Label>
                <Input id="thana" placeholder="e.g. Mirpur, Dhanmondi" value={thana} onChange={(e) => setThana(e.target.value)} className="h-10" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="area">Ward / Moholla</Label>
                <Input id="area" placeholder="e.g. Ward 12, Shewrapara" value={area} onChange={(e) => setArea(e.target.value)} className="h-10" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="detailAddress">Detailed Address / Landmark</Label>
              <Input id="detailAddress" placeholder="e.g. Near Agora Supermarket, Road 7" value={detailAddress} onChange={(e) => setDetailAddress(e.target.value)} className="h-10" />
            </div>

            {buildAddress() && (
              <div className="flex items-start gap-2.5 rounded-lg bg-muted/60 px-4 py-3 text-sm">
                <MapPin className="mt-0.5 size-4 shrink-0 text-primary" weight="fill" />
                <span className="text-muted-foreground leading-relaxed">{buildAddress()}</span>
              </div>
            )}

            {/* GPS */}
            <div className={`rounded-xl border p-4 transition-colors ${gpsCoords ? "border-emerald-500/40 bg-emerald-500/5" : "border-border"}`}>
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className={`flex size-9 items-center justify-center rounded-full ${gpsCoords ? "bg-emerald-500/15 text-emerald-600" : "bg-muted text-muted-foreground"}`}>
                    {gpsCoords ? <CheckCircle className="size-5" weight="fill" /> : <NavigationArrow className="size-4" />}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{gpsCoords ? "GPS Captured" : "GPS Coordinates"}</p>
                    <p className="text-xs text-muted-foreground">
                      {gpsCoords ? `${gpsCoords.lat.toFixed(6)}, ${gpsCoords.lng.toFixed(6)}` : "Required for precise map reporting"}
                    </p>
                  </div>
                </div>
                <Button type="button" variant={gpsCoords ? "outline" : "secondary"} size="sm" onClick={handleDetectGps} disabled={gpsLoading} className="shrink-0">
                  {gpsLoading ? <><Loader2 className="mr-1.5 size-3.5 animate-spin" />Locating…</> : gpsCoords ? "Re-capture" : <><NavigationArrow className="mr-1.5 size-3.5" />Detect</>}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Photos */}
        {currentStep === 3 && (
          <div className="space-y-5 animate-in fade-in-0 slide-in-from-right-4 duration-300">
            <div className="flex items-center justify-between pb-2">
              <div className="space-y-1">
                <h2 className="text-lg font-semibold">Evidence Photos</h2>
                <p className="text-sm text-muted-foreground">Upload up to 3 photos. Optional but helpful.</p>
              </div>
              <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
                {photos.length} / 3
              </span>
            </div>

            <input type="file" multiple accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileChange} />

            {photos.length === 0 ? (
              <div
                onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`cursor-pointer rounded-xl border-2 border-dashed p-10 text-center transition-all duration-200 ${isDragging ? "border-primary bg-primary/5 scale-[1.01]" : "border-border hover:border-primary/50 hover:bg-muted/40"}`}
              >
                <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-muted">
                  <CloudArrowUp className="size-7 text-muted-foreground" />
                </div>
                <p className="text-sm font-semibold">Drop images here or click to browse</p>
                <p className="mt-1 text-xs text-muted-foreground">PNG, JPG, WEBP – up to 3 photos</p>
                <Button type="button" variant="outline" size="sm" className="mt-5" onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click() }}>
                  <ImageIcon className="mr-2 size-3.5" />{t.selectFiles}
                </Button>
              </div>
            ) : (
              <div onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
                className={`grid grid-cols-2 gap-3 sm:grid-cols-3 rounded-xl transition-all ${isDragging ? "ring-2 ring-primary ring-offset-2" : ""}`}>
                {photos.map((p, i) => (
                  <div key={i} className="relative group rounded-xl overflow-hidden border border-border bg-muted">
                    <AspectRatio ratio={4 / 3}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={p.preview} alt={p.file?.name ?? "Photo"} className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-300" />
                    </AspectRatio>
                    <button type="button" onClick={() => setPhotos((prev) => prev.filter((_, j) => j !== i))}
                      className="absolute top-2 right-2 flex size-6 items-center justify-center bg-background/80 backdrop-blur-sm text-foreground rounded-full opacity-0 group-hover:opacity-100 shadow-sm transition-opacity hover:bg-destructive hover:text-destructive-foreground">
                      <X className="size-3.5" weight="bold" />
                    </button>
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <p className="text-[10px] text-white/80 truncate">{p.file?.name}</p>
                    </div>
                  </div>
                ))}
                {photos.length < 3 && (
                  <button type="button" onClick={() => fileInputRef.current?.click()}
                    className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-xl aspect-[4/3] hover:bg-muted/50 transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
                    <Plus className="size-5 text-muted-foreground mb-1.5" weight="bold" />
                    <span className="text-xs text-muted-foreground font-medium">Add more</span>
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Step 4: Review & Submit */}
        {currentStep === 4 && (
          <div className="space-y-5 animate-in fade-in-0 slide-in-from-right-4 duration-300">
            <div className="space-y-1 pb-2">
              <h2 className="text-lg font-semibold">Review & Submit</h2>
              <p className="text-sm text-muted-foreground">Confirm everything looks correct before submitting.</p>
            </div>

            <div className="divide-y divide-border rounded-xl border border-border overflow-hidden text-sm">
              {/* Details row */}
              <div className="flex gap-4 px-4 py-4">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <FileText className="size-4" weight="fill" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">Concern</p>
                  <p className="font-semibold text-foreground leading-snug">{title}</p>
                  {category && (
                    <span className="mt-1 inline-block rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground capitalize">
                      {CONCERN_CATEGORIES.find((c) => c.value === category)?.label}
                    </span>
                  )}
                  {description && <p className="mt-2 text-muted-foreground line-clamp-2 text-xs leading-relaxed">{description}</p>}
                </div>
                <button type="button" onClick={() => goToStep(1)} className="shrink-0 text-xs text-primary hover:underline">Edit</button>
              </div>

              {/* Location row */}
              <div className="flex gap-4 px-4 py-4">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <MapPin className="size-4" weight="fill" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">Location</p>
                  <p className="font-medium text-foreground leading-snug">{buildAddress() || `${district}, ${division}`}</p>
                  {gpsCoords && (
                    <p className="mt-1 font-mono text-xs text-muted-foreground">{gpsCoords.lat.toFixed(5)}, {gpsCoords.lng.toFixed(5)}</p>
                  )}
                </div>
                <button type="button" onClick={() => goToStep(2)} className="shrink-0 text-xs text-primary hover:underline">Edit</button>
              </div>

              {/* Photos row */}
              <div className="flex gap-4 px-4 py-4">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Camera className="size-4" weight="fill" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Photos</p>
                  {photos.length > 0 ? (
                    <div className="flex gap-2">
                      {photos.map((p, i) => (
                        <div key={i} className="size-14 overflow-hidden rounded-lg border border-border bg-muted">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={p.preview} alt="" className="size-full object-cover" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-xs italic">No photos attached</p>
                  )}
                </div>
                <button type="button" onClick={() => goToStep(3)} className="shrink-0 text-xs text-primary hover:underline">Edit</button>
              </div>
            </div>

            {/* AI preview — user can run analysis before submitting */}
            {(description || title).length >= 10 && (
              <AiInsightPanel
                text={description || title}
                autoFetch={false}
              />
            )}
          </div>
        )}
      </div>

      {/* ── Error message ── */}
      {error && (
        <div className="flex items-start gap-2.5 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive mt-5">
          <Warning className="mt-0.5 size-4 shrink-0" weight="fill" />
          <span>{error}</span>
        </div>
      )}

      {/* ── Navigation buttons ── */}
      <div className={`mt-6 flex gap-3 ${currentStep > 1 ? "justify-between" : "justify-end"}`}>
        {currentStep > 1 && (
          <Button type="button" variant="outline" onClick={goBack} disabled={isSubmitting}>
            <ArrowLeft className="mr-2 size-4" />
            Back
          </Button>
        )}

        {currentStep < 4 ? (
          <Button type="button" onClick={validateAndNext}>
            Continue
            <ArrowRight className="ml-2 size-4" />
          </Button>
        ) : (
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="min-w-[140px] font-semibold"
          >
            {isSubmitting ? (
              <><Loader2 className="mr-2 size-4 animate-spin" />{t.submitting}</>
            ) : (
              <><PaperPlaneTilt className="mr-2 size-4" weight="fill" />{t.submitBtn}</>
            )}
          </Button>
        )}
      </div>
    </div>
  )
}
