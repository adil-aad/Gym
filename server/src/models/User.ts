import mongoose, { Schema, Document, Model } from 'mongoose';
import bcrypt from 'bcryptjs';

// ─── TypeScript Interface ────────────────────────────────────────────────────

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: 'owner' | 'admin';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;

  /** Compare a candidate password against the stored hash */
  comparePassword(candidatePassword: string): Promise<boolean>;
}

// ─── Schema Definition ──────────────────────────────────────────────────────

const UserSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },

    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        'Please provide a valid email address',
      ],
    },

    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false, // excluded from queries by default
    },

    role: {
      type: String,
      enum: {
        values: ['owner', 'admin'],
        message: '{VALUE} is not a valid role',
      },
      default: 'admin',
      required: true,
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

// ─── Indexes ────────────────────────────────────────────────────────────────
// (unique index on email is created by `unique: true` on the field itself)

// ─── Pre-save Hook — Password Hashing ───────────────────────────────────────

UserSchema.pre('save', async function () {
  // Only hash if the password field was modified (or is new)
  if (!this.isModified('password')) return;

  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
});

// ─── Instance Methods ───────────────────────────────────────────────────────

UserSchema.methods.comparePassword = async function (
  candidatePassword: string,
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// ─── Model Export ───────────────────────────────────────────────────────────

const User: Model<IUser> = mongoose.model<IUser>('User', UserSchema);
export default User;
