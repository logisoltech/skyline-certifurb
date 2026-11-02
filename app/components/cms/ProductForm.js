"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { deleteProductsAction, saveProductAction } from "../../cms/actions/products";
import { uploadImageAction } from "../../cms/actions/uploads";
import {
  BRANDS,
  BRAND_NAMES,
  CONDITIONS,
  DEFAULT_WARRANTY,
  PLACEHOLDER_IMAGE,
  PROCESSOR_SUGGESTIONS,
  USES,
} from "../../lib/cms/constants";
import { MAX_IMAGES, emptyVariant } from "../../lib/cms/product-model";
import { useCmsAction } from "./hooks";
import { Card, Field, Notice, btnDanger, btnPrimary, btnSecondary, formatDateTime, inputClass } from "./ui";

const USE_LABELS = { student: "Student", business: "Business", premium: "Premium / performance" };

function Checkbox({ name, label, defaultChecked, hint, value }) {
  return (
    <label className="flex cursor-pointer items-start gap-2.5 text-sm text-zinc-800">
      <input
        type="checkbox"
        name={name}
        value={value}
        defaultChecked={defaultChecked}
        className="mt-0.5 h-4 w-4 accent-brand-600"
      />
      <span>
        {label}
        {hint && <span className="block text-[11px] text-zinc-500">{hint}</span>}
      </span>
    </label>
  );
}

function toFormVariant(variant) {
  return {
    id: variant?.id ?? "",
    sku: variant?.sku ?? "",
    ram: variant?.ram ?? "",
    ssd: variant?.ssd ?? "",
    price: variant?.price ?? "",
    stock: String(variant?.stock ?? 0),
    processor: variant?.processor ?? "",
    generation: variant?.generation ?? "",
  };
}

export default function ProductForm({ product, canWrite, justCreated }) {
  const router = useRouter();
  const [state, onSubmit, pending] = useCmsAction(saveProductAction);
  const errors = state?.fieldErrors ?? {};
  const editing = Boolean(product);

  useEffect(() => {
    if (state?.created && state.id) {
      router.push(`/cms/products/${state.id}?created=1`);
    }
  }, [state, router]);

  const [images, setImages] = useState(() =>
    product?.images?.length ? product.images : [product?.image || PLACEHOLDER_IMAGE],
  );
  const [variants, setVariants] = useState(() =>
    product?.variants?.length ? product.variants.map(toFormVariant) : [emptyVariant()],
  );
  const [uploadError, setUploadError] = useState(null);
  const [uploading, startUpload] = useTransition();
  const fileRef = useRef(null);

  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, startDelete] = useTransition();
  const [deleteError, setDeleteError] = useState(null);

  function handleFiles(event) {
    const files = [...(event.target.files ?? [])];
    if (files.length === 0) return;
    setUploadError(null);
    startUpload(async () => {
      let next = images;
      for (const file of files) {
        if (next.length >= MAX_IMAGES) {
          setUploadError(`At most ${MAX_IMAGES} photos.`);
          break;
        }
        const formData = new FormData();
        formData.set("file", file);
        const result = await uploadImageAction(formData);
        if (!result.ok) {
          setUploadError(result.error);
          break;
        }
        next = next[0] === PLACEHOLDER_IMAGE && next.length === 1 ? [result.path] : [...next, result.path];
      }
      setImages(next);
      if (fileRef.current) fileRef.current.value = "";
    });
  }

  function moveImage(index, delta) {
    const target = index + delta;
    if (target < 0 || target >= images.length) return;
    setImages((prev) => {
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  function removeImage(index) {
    setImages((prev) => {
      const next = prev.filter((_, i) => i !== index);
      return next.length ? next : [PLACEHOLDER_IMAGE];
    });
  }

  function setVariant(index, key, value) {
    setVariants((prev) => prev.map((v, i) => (i === index ? { ...v, [key]: value } : v)));
  }

  function addVariant() {
    setVariants((prev) => [...prev, emptyVariant()]);
  }

  function removeVariant(index) {
    setVariants((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== index)));
  }

  function handleDelete() {
    setDeleteError(null);
    startDelete(async () => {
      const result = await deleteProductsAction([product.id]);
      if (result.ok) router.push("/cms/products");
      else setDeleteError(result.error);
    });
  }

  const err = (field) => errors[field];
  const bad = (field) => (errors[field] ? true : undefined);
  const variantErr = (index, field) => errors[`variants.${index}.${field}`];

  return (
    <form onSubmit={onSubmit} noValidate>
      <input type="hidden" name="id" value={product?.id ?? ""} />
      <input type="hidden" name="variantsJson" value={JSON.stringify(variants)} />
      {images.map((src) => (
        <input key={src} type="hidden" name="images" value={src} />
      ))}
      <fieldset disabled={!canWrite || pending} className="contents">
        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <div className="space-y-6">
            {justCreated && <Notice tone="success">Product created. It's live on the store once it's published.</Notice>}
            {state?.ok && <Notice tone="success">{state.message}</Notice>}
            {state?.error && <Notice tone="error">{state.error}</Notice>}
            {Object.keys(errors).length > 0 && (
              <Notice tone="error">Please fix the highlighted fields below.</Notice>
            )}
            {!canWrite && <Notice tone="info">You have read-only access, so editing is turned off.</Notice>}

            <Card title="Basic information">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Title" htmlFor="title" error={err("title")} hint="Shown on cards and the product page." className="sm:col-span-2">
                  <input id="title" name="title" defaultValue={product?.title} aria-invalid={bad("title")} className={inputClass} />
                </Field>
                <Field label="URL slug" htmlFor="slug" error={err("slug")} hint={editing ? "Changing this changes the product's web address." : "Leave blank to build it from the title."}>
                  <input id="slug" name="slug" defaultValue={product?.slug} aria-invalid={bad("slug")} className={inputClass} />
                </Field>
                <Field label="Brand" htmlFor="brand" error={err("brand")}>
                  <select id="brand" name="brand" defaultValue={product?.brand ?? ""} aria-invalid={bad("brand")} className={inputClass}>
                    <option value="" disabled>Choose a brand</option>
                    {BRANDS.map((b) => (
                      <option key={b} value={b}>{BRAND_NAMES[b]}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Condition" htmlFor="condition" error={err("condition")}>
                  <select id="condition" name="condition" defaultValue={product?.condition ?? "Excellent"} className={inputClass}>
                    {CONDITIONS.map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Warranty" htmlFor="warranty">
                  <input id="warranty" name="warranty" defaultValue={product?.warranty ?? DEFAULT_WARRANTY} className={inputClass} />
                </Field>
              </div>
            </Card>

            <Card title="Shared specifications" description="These apply to every option unless an option overrides the processor.">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Processor" htmlFor="processor" error={err("processor")}>
                  <input id="processor" name="processor" list="processors" defaultValue={product?.processor} aria-invalid={bad("processor")} className={inputClass} />
                  <datalist id="processors">
                    {PROCESSOR_SUGGESTIONS.map((p) => (
                      <option key={p} value={p} />
                    ))}
                  </datalist>
                </Field>
                <Field label="CPU generation" htmlFor="generation" error={err("generation")} hint="Intel only. Leave blank for AMD / Apple.">
                  <input id="generation" name="generation" inputMode="numeric" defaultValue={product?.generation ?? ""} aria-invalid={bad("generation")} className={inputClass} />
                </Field>
                <Field label="Screen size (inches)" htmlFor="screen" error={err("screen")}>
                  <input id="screen" name="screen" inputMode="decimal" defaultValue={product?.screen} aria-invalid={bad("screen")} className={inputClass} />
                </Field>
                <div className="flex flex-col justify-end gap-3 pb-1">
                  <Checkbox name="touch" label="Touchscreen" defaultChecked={product?.touch} />
                  <Checkbox name="twoInOne" label="2-in-1 (convertible)" defaultChecked={product?.twoInOne} />
                </div>
                <fieldset className="sm:col-span-2">
                  <legend className="mb-2 text-xs font-bold text-zinc-800">Shown under "Shop by use"</legend>
                  <input type="hidden" name="uses" value="" />
                  <div className="flex flex-wrap gap-x-6 gap-y-2">
                    {USES.map((use) => (
                      <Checkbox
                        key={use}
                        name="uses"
                        value={use}
                        label={USE_LABELS[use]}
                        defaultChecked={product?.uses?.includes(use)}
                      />
                    ))}
                  </div>
                  {err("uses") && <p role="alert" className="mt-1 text-[11px] font-medium text-red-600">{err("uses")}</p>}
                </fieldset>
              </div>
            </Card>

            <Card
              title="Options"
              description="Shoppers see one listing and pick RAM, storage and any other hardware difference here. Each option has its own SKU, price and stock."
              action={
                canWrite ? (
                  <button type="button" onClick={addVariant} className={btnSecondary}>
                    Add option
                  </button>
                ) : null
              }
            >
              {err("variants") && <p role="alert" className="mb-3 text-[11px] font-medium text-red-600">{err("variants")}</p>}
              <div className="space-y-4">
                {variants.map((variant, index) => (
                  <div key={variant.id || `new-${index}`} className="rounded-2xl border border-zinc-200 bg-zinc-50/60 p-4">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <p className="text-xs font-bold uppercase tracking-wide text-zinc-500">Option {index + 1}</p>
                      {variants.length > 1 && canWrite && (
                        <button type="button" onClick={() => removeVariant(index)} className="text-[11px] font-bold text-red-600 hover:underline">
                          Remove
                        </button>
                      )}
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      <Field label="SKU" htmlFor={`sku-${index}`} error={variantErr(index, "sku")}>
                        <input
                          id={`sku-${index}`}
                          value={variant.sku}
                          onChange={(e) => setVariant(index, "sku", e.target.value)}
                          aria-invalid={variantErr(index, "sku") ? true : undefined}
                          className={`${inputClass} uppercase`}
                        />
                      </Field>
                      <Field label="RAM (GB)" htmlFor={`ram-${index}`} error={variantErr(index, "ram")}>
                        <input
                          id={`ram-${index}`}
                          inputMode="numeric"
                          value={variant.ram}
                          onChange={(e) => setVariant(index, "ram", e.target.value)}
                          aria-invalid={variantErr(index, "ram") ? true : undefined}
                          className={inputClass}
                        />
                      </Field>
                      <Field label="Storage / SSD (GB)" htmlFor={`ssd-${index}`} error={variantErr(index, "ssd")} hint="Use 1024 for 1TB.">
                        <input
                          id={`ssd-${index}`}
                          inputMode="numeric"
                          value={variant.ssd}
                          onChange={(e) => setVariant(index, "ssd", e.target.value)}
                          aria-invalid={variantErr(index, "ssd") ? true : undefined}
                          className={inputClass}
                        />
                      </Field>
                      <Field label="Price (AED)" htmlFor={`price-${index}`} error={variantErr(index, "price")}>
                        <input
                          id={`price-${index}`}
                          inputMode="numeric"
                          value={variant.price}
                          onChange={(e) => setVariant(index, "price", e.target.value)}
                          aria-invalid={variantErr(index, "price") ? true : undefined}
                          className={inputClass}
                        />
                      </Field>
                      <Field label="Units in stock" htmlFor={`stock-${index}`} error={variantErr(index, "stock")}>
                        <input
                          id={`stock-${index}`}
                          inputMode="numeric"
                          value={variant.stock}
                          onChange={(e) => setVariant(index, "stock", e.target.value)}
                          aria-invalid={variantErr(index, "stock") ? true : undefined}
                          className={inputClass}
                        />
                      </Field>
                      <Field label="Processor override" htmlFor={`cpu-${index}`} error={variantErr(index, "processor")} hint="Leave blank to use the shared processor.">
                        <input
                          id={`cpu-${index}`}
                          list="processors"
                          value={variant.processor}
                          onChange={(e) => setVariant(index, "processor", e.target.value)}
                          className={inputClass}
                        />
                      </Field>
                      <Field label="Generation override" htmlFor={`gen-${index}`} error={variantErr(index, "generation")} hint="Leave blank to use the shared generation.">
                        <input
                          id={`gen-${index}`}
                          inputMode="numeric"
                          value={variant.generation}
                          onChange={(e) => setVariant(index, "generation", e.target.value)}
                          className={inputClass}
                        />
                      </Field>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <div className="space-y-6">
            <Card title="Publish">
              <div className="space-y-4">
                <Field label="Status" htmlFor="status" error={err("status")}>
                  <select id="status" name="status" defaultValue={product?.status ?? "draft"} className={inputClass}>
                    <option value="published">Published (visible on the store)</option>
                    <option value="draft">Draft (hidden)</option>
                  </select>
                </Field>
                <Checkbox name="featured" label="Featured" hint="Prioritised in “Featured renewed laptops” on the home page." defaultChecked={product?.featured} />

                {canWrite && (
                  <button type="submit" disabled={pending} className={`${btnPrimary} h-10 w-full`}>
                    {pending ? "Saving…" : editing ? "Save changes" : "Create product"}
                  </button>
                )}
                {editing && product.status === "published" && (
                  <Link href={`/laptops/${product.slug}`} target="_blank" className={`${btnSecondary} w-full`}>
                    View on store ↗
                  </Link>
                )}
                {editing && (
                  <p className="text-[11px] leading-relaxed text-zinc-500">
                    Created {formatDateTime(product.createdAt)}
                    <br />
                    Updated {formatDateTime(product.updatedAt)}
                  </p>
                )}
              </div>
            </Card>

            <Card title="Photos" description={`First photo is the cover. Up to ${MAX_IMAGES}.`}>
              <div className="space-y-3">
                <ul className="grid grid-cols-2 gap-2">
                  {images.map((src, index) => (
                    <li key={`${src}-${index}`} className="relative overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50">
                      <div className="relative aspect-4/3">
                        <Image src={src} alt="" fill sizes="160px" className="object-contain p-2" />
                      </div>
                      {index === 0 && (
                        <span className="absolute left-1.5 top-1.5 rounded-full bg-brand-950 px-2 py-0.5 text-[10px] font-bold text-white">
                          Cover
                        </span>
                      )}
                      {canWrite && (
                        <div className="flex items-center justify-between gap-1 border-t border-zinc-100 bg-white px-1.5 py-1">
                          <button type="button" onClick={() => moveImage(index, -1)} disabled={index === 0} className="px-1 text-[11px] font-bold text-brand-700 disabled:text-zinc-300">
                            ←
                          </button>
                          <button type="button" onClick={() => removeImage(index)} className="text-[11px] font-bold text-red-600">
                            Remove
                          </button>
                          <button type="button" onClick={() => moveImage(index, 1)} disabled={index === images.length - 1} className="px-1 text-[11px] font-bold text-brand-700 disabled:text-zinc-300">
                            →
                          </button>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
                {canWrite && images.length < MAX_IMAGES && (
                  <>
                    <input
                      ref={fileRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      multiple
                      onChange={handleFiles}
                      aria-label="Upload product photos"
                      className="block w-full text-xs text-zinc-600 file:mr-3 file:h-9 file:rounded-lg file:border-0 file:bg-brand-950 file:px-4 file:text-xs file:font-bold file:text-white hover:file:bg-brand-700"
                    />
                    <p className="text-[11px] text-zinc-500">
                      {uploading ? "Uploading…" : "PNG, JPG or WebP, up to 2 MB each. You can select several at once."}
                    </p>
                  </>
                )}
                {(uploadError || err("images")) && (
                  <p role="alert" className="text-[11px] font-medium text-red-600">{uploadError ?? err("images")}</p>
                )}
              </div>
            </Card>

            {editing && canWrite && (
              <Card title="Danger zone">
                {deleteError && <p role="alert" className="mb-3 text-xs font-medium text-red-600">{deleteError}</p>}
                {confirmDelete ? (
                  <div className="space-y-3">
                    <p className="text-xs text-zinc-600">This permanently deletes the product. This can't be undone.</p>
                    <div className="flex gap-2">
                      <button type="button" onClick={handleDelete} disabled={deleting} className={btnDanger}>
                        {deleting ? "Deleting…" : "Yes, delete"}
                      </button>
                      <button type="button" onClick={() => setConfirmDelete(false)} className={btnSecondary}>
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button type="button" onClick={() => setConfirmDelete(true)} className={btnDanger}>
                    Delete product
                  </button>
                )}
              </Card>
            )}
          </div>
        </div>
      </fieldset>
    </form>
  );
}
