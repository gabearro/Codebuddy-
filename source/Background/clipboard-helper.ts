export async function addToClipboard(
  text: string
): Promise<void> {
  if (text.length > 10000000) {
    throw new Error('Content too large to copy');
  }

  try {
    await navigator.clipboard.writeText(text);
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
  }
}
