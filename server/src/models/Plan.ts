import mongoose, { Schema, Document, Model } from 'mongoose';

// ─── TypeScript Interface ────────────────────────────────────────────────────

export interface IPlan extends Document {
  title: string;
  durationInMonths: number;
  price: number;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Schema Definition ──────────────────────────────────────────────────────

const PlanSchema = new Schema<IPlan>(
  {
    title: {
      type: String,
      required: [true, 'Plan title is required'],
      trim: true,
    },

    durationInMonths: {
      type: Number,
      required: [true, 'Duration in months is required'],
      min: [1, 'Duration must be at least 1 month'],
    },

    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
    },

    description: {
      type: String,
      default: undefined,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

// ─── Model Export ───────────────────────────────────────────────────────────

const Plan: Model<IPlan> = mongoose.model<IPlan>('Plan', PlanSchema);
export default Plan;
