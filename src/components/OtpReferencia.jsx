import { useRef } from 'react';
import { Hash } from 'lucide-react';

export function OtpReferencia({ register, setValue, errors }) {
  const inputsRef = useRef([]);

  const syncFormValue = () => {
    const code = inputsRef.current.map((input) => input?.value || '').join('');

    setValue('ult_4_ref', code, {
      shouldDirty: true,
      shouldTouch: true,
    });
  };

  const handleChange = (e, index) => {
    let value = e.target.value.replace(/\D/g, '');

    // ⛔️ Nunca permitir más de 1 dígito por input
    if (value.length > 1) {
      value = value.charAt(value.length - 1);
    }

    inputsRef.current[index].value = value;

    // 👉 Avanzar solo si hay dígito
    if (value && index < 3) {
      inputsRef.current[index + 1]?.focus();
    }

    syncFormValue();
  };

  const handleKeyDown = (e, index) => {
    if (e.key === 'Backspace') {
      e.preventDefault();

      if (inputsRef.current[index].value) {
        inputsRef.current[index].value = '';
      } else if (index > 0) {
        inputsRef.current[index - 1].value = '';
        inputsRef.current[index - 1]?.focus();
      }

      syncFormValue();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4);

    pasted.split('').forEach((digit, i) => {
      if (inputsRef.current[i]) {
        inputsRef.current[i].value = digit;
      }
    });

    const nextIndex = Math.min(pasted.length, 3);
    inputsRef.current[nextIndex]?.focus();

    syncFormValue();
  };

  return (
    <div className="space-y-2">
      {/* RHF hidden field */}
      <input type="hidden" {...register('ult_4_ref')} />

      <label className="    w-full
    flex items-center justify-center gap-2
    text-xs text-primary font-semibold uppercase">
        <Hash size={14} />
        Referencia
      </label>

      <div className="flex justify-center gap-3" onPaste={handlePaste}>
        {[0, 1, 2, 3].map((index) => (
          <input
            key={index}
            ref={(el) => (inputsRef.current[index] = el)}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={1}
            onChange={(e) => handleChange(e, index)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            className="
              w-14 h-14
              rounded-xl
              bg-black/40
              border-2 border-white/20
              text-white text-2xl font-black
              text-center
              focus:border-primary
              focus:outline-none
              transition-all
            "
          />
        ))}
      </div>

      {errors?.ult_4_ref && (
        <p className="text-red-400 text-xs text-center animate-in fade-in">{errors.ult_4_ref.message}</p>
      )}
    </div>
  );
}
