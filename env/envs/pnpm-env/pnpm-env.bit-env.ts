/**
 * this env extends the Bit official NodeJS environment.
 * learn more: https://bit.cloud/bitdev/node/node-env
 */
import { NodeEnv } from "@bitdev/node.node-env";
import { Compiler } from "@teambit/compiler";
import { EnvHandler } from "@teambit/envs";
import { Pipeline } from "@teambit/builder";
import {
	TypescriptCompiler,
	resolveTypes,
	TypescriptTask,
} from "@teambit/typescript.typescript-compiler";
import { ESLintLinter, EslintTask } from "@teambit/defender.eslint-linter";
import { JestTask, JestTester } from "@teambit/defender.jest-tester";
import { PrettierFormatter } from "@teambit/defender.prettier-formatter";
import { Tester } from "@teambit/tester";

export class PnpmEnv extends NodeEnv {
	/* shorthand name for the environment */
	name = "pnpm-env";

	protected tsconfigPath = require.resolve("./config/tsconfig.json");
	protected tsTypesPath = "./types";
	protected eslintConfigPath = require.resolve("./config/eslintrc.js");
	protected jestConfigPath = require.resolve("./config/jest.config.js");
	protected prettierConfigPath = require.resolve("./config/prettier.config.js");
	protected eslintExtensions = ["ts", "tsx"];

	/* the compiler to use during development */
	compiler(): EnvHandler<Compiler> {
		return TypescriptCompiler.from({
			tsconfig: this.tsconfigPath,
			types: resolveTypes(__dirname, [this.tsTypesPath]),
		});
	}

	/* the test runner to use during development */
	tester(): EnvHandler<Tester> {
		return JestTester.from({
			config: this.jestConfigPath,
		});
	}

	/* the linter to use during development */
	linter() {
		return ESLintLinter.from({
			tsconfig: this.tsconfigPath,
			configPath: this.eslintConfigPath,
			pluginsPath: __dirname,
			extensions: this.eslintExtensions,
		});
	}

	/**
	 * the formatter to use during development
	 * (source files are not formatted as part of the components' build)
	 */
	formatter() {
		return PrettierFormatter.from({
			configPath: this.prettierConfigPath,
		});
	}

	/**
	 * a set of processes to be performed before a component is snapped, during its build phase
	 * @see https://bit.dev/docs/node-env/build-pipelines
	 */
	build() {
		return Pipeline.from([
			TypescriptTask.from({
				tsconfig: this.tsconfigPath,
				types: resolveTypes(__dirname, [this.tsTypesPath]),
			}),
			EslintTask.from({
				tsconfig: this.tsconfigPath,
				configPath: this.eslintConfigPath,
				pluginsPath: __dirname,
				extensions: this.eslintExtensions,
			}),
			JestTask.from({ config: this.jestConfigPath }),
		]);
	}
}

export default new PnpmEnv();
