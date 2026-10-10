export function getInitials(name: string, max: number = 2) {
	return name
		.trim()
		.split(/\s+/)
		.map((part) => part[0])
		.slice(0, max)
		.join('')
		.toUpperCase();
}
