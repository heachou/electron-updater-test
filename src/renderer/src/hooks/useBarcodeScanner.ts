import { useState, useEffect, useCallback, useRef } from 'react'

interface UseBarcodeScannerOptions {
  /**
   * Callback function triggered when a barcode is successfully scanned.
   * @param code The scanned barcode string.
   */
  onScan: (code: string) => void
  /**
   * Maximum time (in milliseconds) allowed between consecutive keypresses
   * to be considered part of the same scan. Defaults to 50ms.
   */
  timeout?: number
  /**
   * Minimum length of a valid barcode. Scans shorter than this will be ignored.
   * Defaults to 3.
   */
  minLength?: number
  /**
   * Keys that signify the end of a scan. Defaults to ['Enter'].
   * Can be useful if your scanner uses Tab or another key as a suffix.
   */
  endKeys?: string[]
  /**
   * Prevent the default action of the end key (e.g., form submission on Enter).
   * Defaults to true.
   */
  preventDefault?: boolean
  /**
   * Prevent the default action of character keys during a rapid scan sequence.
   * Defaults to false. Set to true if you don't want scanned characters appearing in focused inputs.
   */
  preventInput?: boolean
}

/**
 * React hook to listen for barcode scanner input (simulating keyboard).
 * It detects rapid key presses and calls `onScan` when an end key is pressed
 * or a timeout occurs after minimum length is met (timeout logic not fully implemented here yet for simplicity, focuses on endKey).
 */
const useBarcodeScanner = ({
  onScan,
  timeout = 50,
  minLength = 3,
  endKeys = ['Enter'],
  preventDefault = true,
  preventInput = false
}: UseBarcodeScannerOptions) => {
  const [internalCode, setInternalCode] = useState<string>('')
  // Using useRef to avoid stale closures in the event listener
  const lastKeyTimeRef = useRef<number>(Date.now())
  const codeRef = useRef<string>('')
  const optionsRef = useRef({ onScan, timeout, minLength, endKeys, preventDefault, preventInput })

  // Update options ref if they change
  useEffect(() => {
    optionsRef.current = { onScan, timeout, minLength, endKeys, preventDefault, preventInput }
  }, [onScan, timeout, minLength, endKeys, preventDefault, preventInput])

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    const { key } = event
    const currentTime = Date.now()
    const timeDiff = currentTime - lastKeyTimeRef.current
    lastKeyTimeRef.current = currentTime

    const {
      onScan: currentOnScan,
      timeout: currentTimeout,
      minLength: currentMinLength,
      endKeys: currentEndKeys,
      preventDefault: currentPreventDefault,
      preventInput: currentPreventInput
    } = optionsRef.current

    // Reset if timeout exceeded or non-character key (excluding endKeys) is pressed mid-scan
    if (timeDiff > currentTimeout && key.length === 1) {
      codeRef.current = key // Start new code sequence
      setInternalCode(key) // Update state for potential debugging/display
      return // Don't process further if starting new
    }

    if (currentEndKeys.includes(key)) {
      if (codeRef.current.length >= currentMinLength) {
        currentOnScan(codeRef.current) // Trigger callback
      }
      codeRef.current = '' // Reset code buffer
      setInternalCode('') // Reset state
      if (currentPreventDefault) {
        event.preventDefault() // Prevent default action of the end key
      }
    } else if (key && key.length === 1) {
      // Append character keys if within timeout
      if (timeDiff <= currentTimeout) {
        codeRef.current += key
        setInternalCode((prev) => prev + key) // Update state
        if (currentPreventInput) {
          event.preventDefault() // Prevent character from appearing in input
        }
      } else {
        // If timeout exceeded but it's a character, start new code
        codeRef.current = key
        setInternalCode(key)
      }
    } else {
      // Handle other keys if necessary (e.g., Backspace might reset the buffer)
      // Or simply ignore function keys, arrow keys etc.
      // console.log('Ignoring key:', key);
      // Optionally reset if an unexpected key is pressed mid-scan
      // codeRef.current = '';
      // setInternalCode('');
    }
  }, []) // Empty dependency array, relies on refs for latest values

  useEffect(() => {
    // Ensure listener is attached globally or to a specific element if needed
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [handleKeyDown]) // Re-attach if handleKeyDown definition changes (shouldn't with useCallback)

  // You might return the current internalCode for display/debugging if needed
  return internalCode
}

export default useBarcodeScanner
