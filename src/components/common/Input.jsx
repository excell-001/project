import { forwardRef } from 'react';

const Input = forwardRef(function Input(
  { label, error, helperText, required = false, className = '', id, ...props },
  ref
) {
  const inputId = id || props.name;

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-xs font-semibold text-slate-700 mb-1.5"
        >
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <input
        ref={ref}
        id={inputId}
        className={`w-full rounded-xl border px-3.5 py-2.5 text-sm text-slate-900 bg-white placeholder:text-slate-400 transition-colors focus:outline-none focus:ring-4 ${
          error
            ? 'border-red-400 focus:border-red-500 focus:ring-red-500/15'
            : 'border-slate-300 focus:border-royal-600 focus:ring-royal-600/15'
        } disabled:bg-slate-100 disabled:text-slate-500 ${className}`}
        {...props}
      />
      {error && <p className="mt-1 text-xs font-medium text-red-600">{error}</p>}
      {!error && helperText && (
        <p className="mt-1 text-xs text-slate-500">{helperText}</p>
      )}
    </div>
  );
});

export default Input;