import mongoose, { Schema, Document, Model, Types } from 'mongoose';

// ─── TypeScript Interface ────────────────────────────────────────────────────

export interface IPayment extends Document {
  member: Types.ObjectId;
  plan: Types.ObjectId;
  amount: number;
  paymentMethod: 'cash' | 'card' | 'bank_transfer' | 'other';
  paymentDate: Date;
  processedBy: Types.ObjectId;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Schema Definition ──────────────────────────────────────────────────────

const PaymentSchema = new Schema<IPayment>(
  {
    member: {
      type: Schema.Types.ObjectId,
      ref: 'Member',
      required: [true, 'Member reference is required'],
    },

    plan: {
      type: Schema.Types.ObjectId,
      ref: 'Plan',
      required: [true, 'Plan reference is required'],
    },

    amount: {
      type: Number,
      required: [true, 'Payment amount is required'],
      min: [0, 'Amount cannot be negative'],
    },

    paymentMethod: {
      type: String,
      enum: {
        values: ['cash', 'card', 'bank_transfer', 'other'],
        message: '{VALUE} is not a valid payment method',
      },
      default: 'cash',
    },

    paymentDate: {
      type: Date,
      default: Date.now,
      required: [true, 'Payment date is required'],
    },

    processedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'The user who processed this payment is required'],
    },

    notes: {
      type: String,
      default: undefined,
    },
  },
  {
    timestamps: true,
  },
);

// ─── Indexes ────────────────────────────────────────────────────────────────

// Compound index for fast revenue range queries (monthly / yearly analytics)
PaymentSchema.index({ paymentDate: 1, amount: 1 });

// ─── Model Export ───────────────────────────────────────────────────────────

const Payment: Model<IPayment> = mongoose.model<IPayment>('Payment', PaymentSchema);
export default Payment;
