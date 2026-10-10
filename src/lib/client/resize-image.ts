/**
 * Sny 'n foto in die middel vierkantig, verklein dit na `size` px en enkodeer as WebP
 * (of JPEG as die blaaier nie WebP kan enkodeer nie).
 *
 * Herenkodering via <canvas> verwyder ALLE metadata (EXIF), insluitend GPS-koördinate,
 * voordat die foto die toestel verlaat. Dit is mediavoorbereiding, nie besigheidslogika nie:
 * die bediener valideer tipe en grootte steeds self.
 */
export async function resizeImage(file: File, size = 512): Promise<File> {
	const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
	const side = Math.min(bitmap.width, bitmap.height);
	const sx = (bitmap.width - side) / 2;
	const sy = (bitmap.height - side) / 2;

	const canvas = document.createElement('canvas');
	canvas.width = canvas.height = size;
	const context = canvas.getContext('2d');
	if (!context) throw new Error('Canvas word nie ondersteun nie');
	context.drawImage(bitmap, sx, sy, side, side, 0, 0, size, size);
	bitmap.close();

	let blob = await toBlob(canvas, 'image/webp');
	if (blob.type !== 'image/webp') blob = await toBlob(canvas, 'image/jpeg');

	const extension = blob.type === 'image/webp' ? 'webp' : 'jpg';
	return new File([blob], `profiel.${extension}`, { type: blob.type });
}

function toBlob(canvas: HTMLCanvasElement, type: string) {
	return new Promise<Blob>((resolve, reject) =>
		canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Kon nie enkodeer nie'))), type, 0.85)
	);
}
