import React, { useEffect } from 'react';

import { PageLayoutType } from '@grafana/data';
import { getBackendSrv } from '@grafana/runtime';
import { TimeZone } from '@grafana/schema';
import { Button, PageToolbar } from '@grafana/ui';
import { Page } from 'app/core/components/Page/Page';
import { useGrafana } from 'app/core/context/GrafanaContext';
import { GrafanaRouteComponentProps } from 'app/core/navigation/types';
import { useDispatch, useSelector } from 'app/types';

import { updateTimeZoneForSession } from '../../profile/state/reducers';
import { DashNavTimeControls } from '../components/DashNav/DashNavTimeControls';
import { DashboardFailed } from '../components/DashboardLoading/DashboardFailed';
import { DashboardLoading } from '../components/DashboardLoading/DashboardLoading';
import { DashboardGrid } from '../dashgrid/DashboardGrid';
import { DashboardModel } from '../state';
import { initDashboard } from '../state/initDashboard';

interface EmbeddedDashboardPageRouteParams {
  uid: string;
}

interface EmbeddedDashboardPageRouteSearchParams {
  callbackUrl?: string;
  json?: string;
  accessToken?: string;
}

export type Props = GrafanaRouteComponentProps<
  EmbeddedDashboardPageRouteParams,
  EmbeddedDashboardPageRouteSearchParams
>;

export default function EmbeddedDashboardPage({ match, route, queryParams }: Props) {
  const dispatch = useDispatch();
  const context = useGrafana();
  const dashboardState = useSelector((store) => store.dashboard);
  const dashboard = new DashboardModel(JSON.parse(queryParams.json!));

  useEffect(() => {
    dispatch(
      initDashboard({
        routeName: route.routeName,
        fixUrl: false,
        // TODO check auth
        accessToken: queryParams.accessToken,
        keybindingSrv: context.keybindings,
        urlUid: match.params.uid,
        dashboardDto: { dashboard, meta: {} },
      })
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!dashboard) {
    return <DashboardLoading initPhase={dashboardState.initPhase} />;
  }

  if (dashboard.meta.dashboardNotFound) {
    return <p>Not available</p>;
  }

  return (
    <Page pageNav={{ text: dashboard.title }} layout={PageLayoutType.Custom}>
      <Toolbar dashboard={dashboard} callbackUrl={queryParams.callbackUrl} />
      {dashboardState.initError && <DashboardFailed initError={dashboardState.initError} />}
      <div className={''}>
        <DashboardGrid dashboard={dashboard} isEditable viewPanel={null} editPanel={null} hidePanelMenus />
      </div>
    </Page>
  );
}

interface ToolbarProps {
  dashboard: DashboardModel;
  callbackUrl?: string;
}

const Toolbar = ({ dashboard, callbackUrl }: ToolbarProps) => {
  const dispatch = useDispatch();

  const onChangeTimeZone = (timeZone: TimeZone) => {
    dispatch(updateTimeZoneForSession(timeZone));
  };

  const saveDashboard = () => {
    const clone = dashboard?.getSaveModelClone();
    if (!clone || !callbackUrl) {
      return;
    }

    const data = JSON.stringify(clone, null, 2);
    return getBackendSrv().post(`http://localhost:3000/${callbackUrl}`, { dashboard: data });
  };

  return (
    <PageToolbar title={dashboard.title} buttonOverflowAlignment="right">
      {!dashboard.timepicker.hidden && (
        <DashNavTimeControls dashboard={dashboard} onChangeTimeZone={onChangeTimeZone} />
      )}
      <Button onClick={saveDashboard}>Save</Button>
    </PageToolbar>
  );
};
