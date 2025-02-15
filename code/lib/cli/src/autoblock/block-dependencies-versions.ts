import { createBlocker } from './types';
import { dedent } from 'ts-dedent';
import { lt } from 'semver';

const minimalVersionsMap = {
  '@angular/core': '15.0.0',
  'react-scripts': '5.0.0',
  next: '13.5.0',
  preact: '10.0.0',
  svelte: '4.0.0',
  vue: '3.0.0',
};

type Result = {
  installedVersion: string | undefined;
  packageName: keyof typeof minimalVersionsMap;
  minimumVersion: string;
};
const typedKeys = <TKey extends string>(obj: Record<TKey, any>) => Object.keys(obj) as TKey[];

export const blocker = createBlocker({
  id: 'dependenciesVersions',
  async check({ packageManager }) {
    const list = await Promise.all(
      typedKeys(minimalVersionsMap).map(async (packageName) => ({
        packageName,
        installedVersion: await packageManager.getPackageVersion(packageName),
        minimumVersion: minimalVersionsMap[packageName],
      }))
    );

    return list.reduce<false | Result>((acc, { installedVersion, minimumVersion, packageName }) => {
      if (acc) {
        return acc;
      }
      if (packageName && installedVersion && lt(installedVersion, minimumVersion)) {
        return {
          installedVersion,
          packageName,
          minimumVersion,
        };
      }
      return acc;
    }, false);
  },
  log(options, data) {
    switch (data.packageName) {
      case 'react-scripts':
        return dedent`
          Support react-script < 5.0.0 has been removed.
          Please see the migration guide for more information:
          https://github.com/storybookjs/storybook/blob/next/MIGRATION.md#create-react-app-dropped-cra4-support
          
          Upgrade to the latest version of react-scripts.
        `;
      case 'vue':
        return dedent`
          Support for Vue 2 has been removed.
          Please see the migration guide for more information:
          https://v3-migration.vuejs.org/

          Please upgrade to the latest version of Vue.
        `;
      case '@angular/core':
        return dedent`
          Support for Angular < 15 has been removed.
          Please see the migration guide for more information:
          https://angular.io/guide/update-to-version-15

          Please upgrade to the latest version of Angular.
        `;
      case 'next':
        return dedent`
          Support for Next.js < 13.5 has been removed.
          Please see the migration guide for more information:
          https://nextjs.org/docs/pages/building-your-application/upgrading/version-13

          Please upgrade to the latest version of Next.js.
        `;
      default:
        return dedent`
          Support for ${data.packageName} version < ${data.minimumVersion} has been removed.
          Storybook 8 needs minimum version of ${data.minimumVersion}, but you had version ${data.installedVersion}.

          Please update this dependency.
        `;
    }
  },
});
