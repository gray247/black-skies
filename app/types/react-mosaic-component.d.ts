declare module 'react-mosaic-component' {
  import * as React from 'react';

  export type MosaicDirection = 'row' | 'column';
  export type MosaicPath = Array<'first' | 'second'>;

  export type MosaicNode<T extends string> =
    | T
    | {
        direction: MosaicDirection;
        first: MosaicNode<T>;
        second: MosaicNode<T>;
        splitPercentage?: number;
      };

  export interface MosaicProps<T extends string> {
    className?: string;
    value: MosaicNode<T>;
    onChange?: (newValue: MosaicNode<T> | null) => void;
    renderTile: (id: T, path: MosaicPath) => React.ReactNode;
    zeroStateView?: React.ReactNode;
  }

  export interface MosaicWindowToolbarProps<T extends string> {
    title?: React.ReactNode;
    path: MosaicPath;
    renderDefaultToolbar: () => React.ReactNode;
  }

  export interface MosaicWindowProps<T extends string> {
    path: MosaicPath;
    title?: React.ReactNode;
    className?: string;
    children?: React.ReactNode;
    renderToolbar?: (props: MosaicWindowToolbarProps<T>) => React.ReactNode;
  }

  export interface MosaicZeroStateProps<T extends string> {
    createNode: () => MosaicNode<T>;
  }

  export function Mosaic<T extends string>(props: MosaicProps<T>): JSX.Element;
  export function MosaicWindow<T extends string>(props: MosaicWindowProps<T>): JSX.Element;
  export function MosaicZeroState<T extends string>(props: MosaicZeroStateProps<T>): JSX.Element;
}

declare module 'react-mosaic-component/lib/buttons/defaultToolbarControls' {
  import * as React from 'react';

  export const DEFAULT_CONTROLS_WITH_CREATION: ReadonlyArray<React.ReactElement>;
  export const DEFAULT_CONTROLS_WITHOUT_CREATION: ReadonlyArray<React.ReactElement>;
}
