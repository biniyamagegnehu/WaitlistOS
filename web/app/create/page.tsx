"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { createWaitlist } from "../../services/api";
import { useState } from "react";

const createWaitlistSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  slug: z.string()
    .min(1, "Slug is required")
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with hyphens"),
});

type CreateWaitlistFormValues = z.infer<typeof createWaitlistSchema>;

export default function CreateWaitlistPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateWaitlistFormValues>({
    resolver: zodResolver(createWaitlistSchema),
  });

  const onSubmit = async (data: CreateWaitlistFormValues) => {
    setServerError("");
    try {
      await createWaitlist(data);
      router.push(`/w/${data.slug}`);
    } catch (err: unknown) {
      setServerError(err instanceof Error ? err.message : "Something went wrong");
    }
  };

  return (
    <div className="max-w-md mx-auto mt-20 p-6 bg-white rounded-lg shadow-md border">
      <h1 className="text-2xl font-bold mb-6 text-center">Create Waitlist</h1>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Product Name</label>
          <input
            {...register("name")}
            className="w-full border rounded p-2"
            placeholder="My Awesome Startup"
          />
          {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Slug</label>
          <input
            {...register("slug")}
            className="w-full border rounded p-2"
            placeholder="my-awesome-startup"
          />
          {errors.slug && <p className="text-red-500 text-sm mt-1">{errors.slug.message}</p>}
        </div>



        {serverError && <p className="text-red-500 text-sm">{serverError}</p>}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-black text-white rounded p-2 disabled:opacity-50"
        >
          {isSubmitting ? "Creating..." : "Create Waitlist"}
        </button>
      </form>
    </div>
  );
}
