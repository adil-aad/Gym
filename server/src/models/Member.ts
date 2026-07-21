import mongoose, { Schema, Document, Model, Types } from 'mongoose';

// ─── TypeScript Interface ────────────────────────────────────────────────────

export interface IMember extends Document {
  fullName: string;
  phone: string;
  email?: string;
  gender?: 'male' | 'female' | 'other';
  emergencyContact?: string;
  currentPlan: Types.ObjectId;
  startDate: Date;
  expiryDate: Date;
  status: 'active' | 'expired' | 'suspended';
  createdAdmin: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;

  /** Virtual — true when the membership has lapsed */
  isExpired: boolean;
}

// ─── Schema Definition ──────────────────────────────────────────────────────

const MemberSchema = new Schema<IMember>(
  {
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
    },

    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
      unique: true,
    },

    email: {
      type: String,
      lowercase: true,
      trim: true,
      default: undefined,
      // Optional, but if present it must look like an email address.
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },

    gender: {
      type: String,
      enum: {
        values: ['male', 'female', 'other'],
        message: '{VALUE} is not a valid gender option',
      },
      default: undefined,
    },

    emergencyContact: {
      type: String,
      default: undefined,
    },

    currentPlan: {
      type: Schema.Types.ObjectId,
      ref: 'Plan',
      required: [true, 'A membership plan is required'],
    },

    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
      default: Date.now,
    },

    expiryDate: {
      type: Date,
      required: [true, 'Expiry date is required'],
    },

    status: {
      type: String,
      enum: {
        values: ['active', 'expired', 'suspended'],
        message: '{VALUE} is not a valid member status',
      },
      default: 'active',
    },

    createdAdmin: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'The admin who onboarded this member is required'],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// ─── Indexes ────────────────────────────────────────────────────────────────

MemberSchema.index({ status: 1, expiryDate: 1 });
// (unique index on phone is created by `unique: true` on the field itself)

// ─── Virtuals ───────────────────────────────────────────────────────────────

MemberSchema.virtual('isExpired').get(function (this: IMember): boolean {
  return this.expiryDate < new Date();
});

// ─── Pre-validate Hook — Auto-calculate expiryDate & flip status ────────────

MemberSchema.pre('validate', async function () {
  // --- Auto-calculate expiryDate if it hasn't been set manually -----------
  // Runs only on new documents or when startDate / currentPlan changed
  if (
    this.isNew ||
    this.isModified('startDate') ||
    this.isModified('currentPlan')
  ) {
    // Only compute when expiryDate was NOT explicitly provided
    if (!this.isModified('expiryDate')) {
      try {
        const Plan = mongoose.model('Plan');
        const plan = await Plan.findById(this.currentPlan);

        if (plan) {
          const start = new Date(this.startDate);
          start.setMonth(start.getMonth() + plan.durationInMonths);
          this.expiryDate = start;
        }
      } catch {
        // If plan lookup fails, leave expiryDate to required-field validation
      }
    }
  }

  // --- Auto-flip status to 'expired' if expiryDate is in the past --------
  if (this.expiryDate && this.expiryDate < new Date() && this.status !== 'suspended') {
    this.status = 'expired';
  }
});

// ─── Model Export ───────────────────────────────────────────────────────────

const Member: Model<IMember> = mongoose.model<IMember>('Member', MemberSchema);
export default Member;
