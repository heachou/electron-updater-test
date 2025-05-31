export const encodeError = (e: Error, channel: string) => {
  return { name: e.name, message: e.message, extra: { ...e, channel } }
}
