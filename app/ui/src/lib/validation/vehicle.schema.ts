import { z } from "zod"
import { locationSchema, loadSchema } from "./common.schema"

export const vehicleSchema = z.object({
  id: z.number().int().nonnegative(),

  vehicleType: z.enum(["truck", "car", "bicycle"]),

  driverName: z.string().min(1).optional(),

  startLocation: locationSchema,

  endLocation: locationSchema.optional(),

  capacity: loadSchema,

  timeWindow: z
    .tuple([
      z.number().int().nonnegative(),
      z.number().int().nonnegative()
    ])
    .refine(
      ([start, end]) => end > start,
      {
        message: "timeWindow end must be after start",
        path: [1]
      }
    )
    .optional()
})

/**
 * Ensure each ID is unique
 */
export const vehiclesSchema = z
  .array(vehicleSchema)
  .superRefine((vehicles, ctx) => {
    const seen = new Set<number>()

    vehicles.forEach((vehicle, index) => {
      if (seen.has(vehicle.id)) {
        ctx.addIssue({
          code: "custom",
          message: `Duplicate vehicle id: ${vehicle.id}`,
          path: [index, "id"]
        })
      }

      seen.add(vehicle.id)
    })
  })
