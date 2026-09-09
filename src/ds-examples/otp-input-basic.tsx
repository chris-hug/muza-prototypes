"use client"

/*
 * OTP Input — a six-digit verification code as two groups of three with a
 * separator between them. One real `<input>` sits behind the slots
 * (`input-otp`); the slots are the display, and the active one carries the
 * focus ring and a blinking fake caret. A four-digit PIN is the same parts
 * with `maxLength={4}` and a single group.
 */

import { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot } from "@/components/ui/input-otp"

export default function OtpInputBasicExample() {
  return (
    <InputOTP maxLength={6} autoFocus={false} aria-label="Verification code">
      <InputOTPGroup>
        <InputOTPSlot index={0} />
        <InputOTPSlot index={1} />
        <InputOTPSlot index={2} />
      </InputOTPGroup>
      <InputOTPSeparator />
      <InputOTPGroup>
        <InputOTPSlot index={3} />
        <InputOTPSlot index={4} />
        <InputOTPSlot index={5} />
      </InputOTPGroup>
    </InputOTP>
  )
}
