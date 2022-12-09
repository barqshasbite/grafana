import { css } from '@emotion/css';
import React, { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';

import { LoadingPlaceholder, useStyles2 } from '@grafana/ui';
import { Page } from 'app/core/components/Page/Page';

import { useGetSingle } from './api';
import { DetailsOverview, DetailsStatus, DetailsHeaderActions } from './components';
import { tabIds, usePluginRecipeDetailsPageTabs } from './hooks';
import { PluginRecipeStep, StepStatus } from './types';
import { installRecipe } from './utils';

const navId = 'connections-plugin-recipes';

export function PluginRecipeDetailsPage() {
  const params = useParams<{ id: string }>();
  const { status, error, data, refetch } = useGetSingle(params.id);
  const { tabId, tabs } = usePluginRecipeDetailsPageTabs();
  const styles = useStyles2(getStyles);
  const [isInstallStarted, setIsInstallStarted] = useState(false);
  const isStepCompleted = (step: PluginRecipeStep) => step.status?.code === StepStatus.Completed;
  const isInstalled = useMemo(() => (data ? data.steps.every(isStepCompleted) : false), [data]);
  const isInstallInProgress = useMemo(() => (data ? Boolean(data.isInstallStarted) : false), [data]);

  const onRunInstall = async () => {
    setIsInstallStarted(true);
    await installRecipe(data);
    refetch();
  };

  // Some random options to be used in the header
  const info = [
    { label: 'Version', value: 'v1.0.0' },
    { label: 'Rating', value: '4/5' },
  ];

  // Loading recipe
  if (status === 'loading') {
    return (
      <Page navId={navId} pageNav={{ text: '', subTitle: '', active: true }}>
        <Page.Contents>
          <LoadingPlaceholder text="Loading..." />
        </Page.Contents>
      </Page>
    );
  }

  // Error while loading recipe
  if (status === 'error') {
    return (
      <Page navId={navId} pageNav={{ text: 'Error', subTitle: '', active: true }}>
        <Page.Contents>
          <p>{String(error)}</p>
        </Page.Contents>
      </Page>
    );
  }

  // Not found
  if (status === 'success' && !data) {
    return (
      <Page navId={navId} pageNav={{ text: '', subTitle: '', active: true }}>
        <Page.Contents>Plugin recipe not found.</Page.Contents>
      </Page>
    );
  }

  return (
    <Page
      navId={navId}
      pageNav={{ text: data.name, subTitle: data.summary, active: true, children: tabs }}
      // Meta info
      info={info}
      // Install actions
      actions={
        <DetailsHeaderActions
          onInstall={onRunInstall}
          isInstalled={isInstalled}
          isInstallInProgress={isInstallStarted || isInstallInProgress}
        />
      }
      // Title with logo
      renderTitle={(title) => (
        <div className={styles.pageTitleContainer}>
          <img className={styles.pageTitleImage} src={data.logo} alt={`Logo of ${data.name}`} />
          <h1 className={styles.pageTitle}>{title}</h1>
        </div>
      )}
    >
      <Page.Contents>
        <div className={styles.content}>
          {/* Overview */}
          {tabId === tabIds.overview && <DetailsOverview recipe={data} />}

          {/* Status */}
          {tabId === tabIds.status && (
            <DetailsStatus
              recipe={data}
              isInstalled={isInstalled}
              isInstallInProgress={isInstallStarted || isInstallInProgress}
              onRunInstall={onRunInstall}
            />
          )}
        </div>
      </Page.Contents>
    </Page>
  );
}

const getStyles = () => ({
  content: css`
    min-width: 900px;
    width: 60%;
  `,
  pageTitleContainer: css`
    display: flex;
    align-items: center;
  `,
  pageTitleImage: css`
    width: 40px;
    height: 40px;
    margin-left: 5px;
    margin-right: 10px;
  `,
  pageTitle: css`
    margin-bottom: 0;
  `,
});
