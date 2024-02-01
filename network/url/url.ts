import nerfDart from "nerf-dart";

export interface ParsedUri {
	/**
	 * The url as string
	 */
	raw: string;
	/**
	 * The parsed url
	 */
	parsed: URL;
	/**
	 * The nerf dart of the url
	 * @example https://example.com -> //example.com/
	 * @example https://example.com:8080/path/to/file  -> //example.com:8080/path/to/
	 */
	nerf: string;
	/**
	 * The host of the url
	 * @example https://example.com -> example.com
	 */
	host: string;
	/**
	 * The host of the url with port
	 * @example https://example.com:8080 -> //example.com:8080/
	 */
	hostOnlyDomain: string;
	/**
	 * The url without port
	 * @example https://example.com:8080/path/to/file -> https://example.com/path/to/file
	 */
	withoutPort: string;
}

export function parseUri(uri: string): ParsedUri {
	const parsed = new URL(uri);

	if (!uri.endsWith("/")) {
		uri += "/";
	}

	return {
		raw: parsed.href,
		parsed,
		nerf: nerfDart(uri),
		host: parsed.hostname,
		hostOnlyDomain: convertToDomain(parsed),
		withoutPort: removePort(parsed),
	};
}

function getMaxParts(uris: string[]) {
	return uris.reduce((max, uri) => {
		const parts = uri.split("/").length;
		return parts > max ? parts : max;
	}, 0);
}

export function getFromUri<T>(
	generic: { [key: string]: T } | undefined,
	uri: string,
): T | undefined {
	if (!generic) return undefined;
	if (generic[uri]) return generic[uri];
	const { nerf, withoutPort } = parseUri(uri);
	const maxParts = getMaxParts(Object.keys(generic));
	const parts = nerf.split("/");
	for (let i = Math.min(parts.length, maxParts) - 1; i >= 3; i--) {
		const key = `${parts.slice(0, i).join("/")}/`;
		if (generic[key]) {
			return generic[key];
		}
	}
	if (withoutPort !== uri) {
		return getFromUri(generic, withoutPort);
	}
	return undefined;
}

function convertToDomain(url: URL): string {
	let result = `//${url.hostname}`;
	if (url.port) {
		result += `:${url.port}`;
	}
	return `${result}/`;
}

function removePort(url: URL): string {
	if (url.port === "") return url.href;
	url.port = "";
	return url.toString();
}