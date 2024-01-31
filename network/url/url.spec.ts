import { parseUri } from "./url";

describe("parseUri", () => {
	it("should parse a simple url", () => {
		const uri = "https://example.com";
		const expected = {
			raw: "https://example.com/",
			parsed: new URL(uri),
			nerf: "//example.com/",
			host: "example.com",
			hostOnlyDomain: "//example.com/",
			withoutPort: "https://example.com/",
		};
		const actual = parseUri(uri);
		expect(actual).toEqual(expected);
	});

	it("should parse a url with a port", () => {
		const uri = "https://example.com:8080";
		const expected = {
			raw: "https://example.com:8080/",
			parsed: new URL(uri),
			nerf: "//example.com:8080/",
			host: "example.com",
			hostOnlyDomain: "//example.com:8080/",
			withoutPort: "https://example.com/",
		};
		const actual = parseUri(uri);
		expect(actual).toEqual(expected);
	});

	it("should parse a url with a path", () => {
		const uri = "https://example.com/path/to/file";
		const expected = {
			raw: "https://example.com/path/to/file",
			parsed: new URL(uri),
			nerf: "//example.com/path/to/file/",
			host: "example.com",
			hostOnlyDomain: "//example.com/",
			withoutPort: "https://example.com/path/to/file",
		};
		const actual = parseUri(uri);
		expect(actual).toEqual(expected);
	});

	it("should parse a url with a query string", () => {
		const uri = "https://example.com?foo=bar";
		const expected = {
			raw: "https://example.com/?foo=bar",
			parsed: new URL(uri),
			nerf: "//example.com/",
			host: "example.com",
			hostOnlyDomain: "//example.com/",
			withoutPort: "https://example.com/?foo=bar",
		};
		const actual = parseUri(uri);
		expect(actual).toEqual(expected);
	});

	it("should parse a url with a fragment identifier", () => {
		const uri = "https://example.com#fragment";
		const expected = {
			raw: "https://example.com/#fragment",
			parsed: new URL(uri),
			nerf: "//example.com/",
			host: "example.com",
			hostOnlyDomain: "//example.com/",
			withoutPort: "https://example.com/#fragment",
		};
		const actual = parseUri(uri);
		expect(actual).toEqual(expected);
	});
});
