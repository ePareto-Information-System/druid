/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {
  Alignment,
  AnchorButton,
  Button,
  Intent,
  Menu,
  MenuDivider,
  MenuItem,
  Navbar,
  NavbarDivider,
  NavbarGroup,
  Position,
  Tag,
} from '@blueprintjs/core';
import { IconNames } from '@blueprintjs/icons';
import { Popover2 } from '@blueprintjs/popover2';
import React, { useState } from 'react';

import {
  AboutDialog,
  CompactionDynamicConfigDialog,
  CoordinatorDynamicConfigDialog,
  DoctorDialog,
  OverlordDynamicConfigDialog,
} from '../../dialogs';
import { Capabilities } from '../../helpers';
import { getLink } from '../../links';
import {
  localStorageGetJson,
  LocalStorageKeys,
  localStorageRemove,
  localStorageSetJson,
  oneOf,
} from '../../utils';
import { PopoverText } from '../popover-text/popover-text';

import { RestrictedMode } from './restricted-mode/restricted-mode';

import './header-bar.scss';

const capabilitiesOverride = localStorageGetJson(LocalStorageKeys.CAPABILITIES_OVERRIDE);

export type HeaderActiveTab =
  | null
  | 'data-loader'
  | 'streaming-data-loader'
  | 'classic-batch-data-loader'
  | 'supervisors'
  | 'tasks'
  | 'datasources'
  | 'segments'
  | 'services'
  | 'workbench'
  | 'sql-data-loader'
  | 'explore'
  | 'lookups';

const DruidLogo = React.memo(function DruidLogo() {
  return (
    <div className="">
      <img src="../../../assets/logo-moh.png" />
    </div>
  );
});

export interface HeaderBarProps {
  active: HeaderActiveTab;
  capabilities: Capabilities;
  onUnrestrict(capabilities: Capabilities): void;
}

export const HeaderBar = React.memo(function HeaderBar(props: HeaderBarProps) {
  const { active, capabilities, onUnrestrict } = props;
  const [aboutDialogOpen, setAboutDialogOpen] = useState(false);
  const [doctorDialogOpen, setDoctorDialogOpen] = useState(false);
  const [coordinatorDynamicConfigDialogOpen, setCoordinatorDynamicConfigDialogOpen] =
    useState(false);
  const [overlordDynamicConfigDialogOpen, setOverlordDynamicConfigDialogOpen] = useState(false);
  const [compactionDynamicConfigDialogOpen, setCompactionDynamicConfigDialogOpen] = useState(false);

  const showSplitDataLoaderMenu = capabilities.hasMultiStageQuery();

  const loadDataViewsMenuActive = oneOf(
    active,
    'data-loader',
    'streaming-data-loader',
    'classic-batch-data-loader',
    'sql-data-loader',
  );
  const loadDataViewsMenu = (
    <Menu>
      <MenuItem
        icon={IconNames.FEED}
        text="Streaming"
        href="#streaming-data-loader"
        selected={active === 'streaming-data-loader'}
      />
      <MenuItem
        icon={IconNames.CLEAN}
        text="Batch - SQL"
        href="#sql-data-loader"
        labelElement={<Tag minimal>multi-stage-query</Tag>}
        selected={active === 'sql-data-loader'}
      />
      <MenuItem
        icon={IconNames.LIST}
        text="Batch - classic"
        href="#classic-batch-data-loader"
        selected={active === 'classic-batch-data-loader'}
      />
    </Menu>
  );

  const moreViewsMenuActive = oneOf(active, 'lookups');
  const moreViewsMenu = (
    <Menu>
      <MenuItem
        icon={IconNames.PROPERTIES}
        text="Lookups"
        href="#lookups"
        disabled={!capabilities.hasCoordinatorAccess()}
        selected={active === 'lookups'}
      />
      <MenuDivider />
      <MenuItem
        icon={IconNames.COMPASS}
        text="Explore"
        label="(experimental)"
        href="#explore"
        disabled={!capabilities.hasSql()}
        selected={active === 'explore'}
      />
    </Menu>
  );

  const helpMenu = (
    <Menu>
      <MenuItem icon={IconNames.GRAPH} text="About" onClick={() => setAboutDialogOpen(true)} />
      <MenuItem icon={IconNames.TH} text="Docs" href={getLink('DOCS')} target="_blank" />
      <MenuItem
        icon={IconNames.USER}
        text="User group"
        href={getLink('USER_GROUP')}
        target="_blank"
      />
      <MenuItem
        icon={IconNames.CHAT}
        text="Slack channel"
        href={getLink('SLACK')}
        target="_blank"
      />
      <MenuItem
        icon={IconNames.GIT_BRANCH}
        text="GitHub"
        href={getLink('GITHUB')}
        target="_blank"
      />
    </Menu>
  );

  function setCapabilitiesOverride(capabilities: Capabilities | undefined): void {
    if (capabilities) {
      localStorageSetJson(LocalStorageKeys.CAPABILITIES_OVERRIDE, capabilities);
    } else {
      localStorageRemove(LocalStorageKeys.CAPABILITIES_OVERRIDE);
    }
    location.reload();
  }

  const capabilitiesMode = capabilities.getModeExtended();
  const configMenu = (
    <Menu>
      <MenuItem
        icon={IconNames.PULSE}
        text="Druid Doctor"
        onClick={() => setDoctorDialogOpen(true)}
        disabled={!capabilities.hasEverything()}
      />
      <MenuItem
        icon={IconNames.SETTINGS}
        text="Coordinator dynamic config"
        onClick={() => setCoordinatorDynamicConfigDialogOpen(true)}
        disabled={!capabilities.hasCoordinatorAccess()}
      />
      <MenuItem
        icon={IconNames.WRENCH}
        text="Overlord dynamic config"
        onClick={() => setOverlordDynamicConfigDialogOpen(true)}
        disabled={!capabilities.hasOverlordAccess()}
      />
      <MenuItem
        icon={IconNames.COMPRESSED}
        text="Compaction dynamic config"
        onClick={() => setCompactionDynamicConfigDialogOpen(true)}
        disabled={!capabilities.hasCoordinatorAccess()}
      />
      <MenuDivider />
      <MenuItem
        icon={IconNames.HIGH_PRIORITY}
        text="Capabilty detection"
        intent={capabilitiesOverride ? Intent.DANGER : undefined}
      >
        {capabilitiesOverride && (
          <>
            <MenuItem
              text="Use automatic capabilty detection"
              onClick={() => setCapabilitiesOverride(undefined)}
              intent={Intent.PRIMARY}
            />
            <MenuDivider />
          </>
        )}
        {capabilitiesMode !== 'coordinator-overlord' && (
          <MenuItem
            text="Manually set Coordinator/Overlord mode"
            onClick={() => setCapabilitiesOverride(Capabilities.COORDINATOR_OVERLORD)}
          />
        )}
        {capabilitiesMode !== 'coordinator' && (
          <MenuItem
            text="Manually set Coordinator mode"
            onClick={() => setCapabilitiesOverride(Capabilities.COORDINATOR)}
          />
        )}
        {capabilitiesMode !== 'overlord' && (
          <MenuItem
            text="Manually set Overlord mode"
            onClick={() => setCapabilitiesOverride(Capabilities.OVERLORD)}
          />
        )}
        {capabilitiesMode !== 'no-proxy' && (
          <MenuItem
            text="Manually set Router with no management proxy mode"
            onClick={() => setCapabilitiesOverride(Capabilities.NO_PROXY)}
          />
        )}
      </MenuItem>
    </Menu>
  );

  return (
    <Navbar className="header-bar">
      <NavbarGroup align={Alignment.LEFT}>
        <a href="#">
          <DruidLogo />
        </a>
        <NavbarDivider />
        <AnchorButton
          className="header-entry"
          minimal
          active={active === 'workbench'}
          icon={IconNames.APPLICATION}
          text="Query"
          href="#workbench"
          disabled={!capabilities.hasQuerying()}
        />
        {showSplitDataLoaderMenu ? (
          <Popover2
            content={loadDataViewsMenu}
            disabled={!capabilities.hasEverything()}
            position={Position.BOTTOM_LEFT}
          >
            <Button
              className="header-entry"
              icon={IconNames.CLOUD_UPLOAD}
              text="Load data"
              minimal
              active={loadDataViewsMenuActive}
              disabled={!capabilities.hasEverything()}
            />
          </Popover2>
        ) : (
          <AnchorButton
            className="header-entry"
            icon={IconNames.CLOUD_UPLOAD}
            text="Load data"
            href="#data-loader"
            minimal
            active={loadDataViewsMenuActive}
            disabled={!capabilities.hasEverything()}
          />
        )}
        <NavbarDivider />
        <AnchorButton
          className="header-entry"
          minimal
          active={active === 'datasources'}
          icon={IconNames.MULTI_SELECT}
          text="Datasources"
          href="#datasources"
          disabled={!capabilities.hasSqlOrCoordinatorAccess()}
        />
        <AnchorButton
          className="header-entry"
          minimal
          active={active === 'supervisors'}
          icon={IconNames.EYE_OPEN}
          text="Supervisors"
          href="#supervisors"
          disabled={!capabilities.hasSqlOrOverlordAccess()}
        />
        <AnchorButton
          className="header-entry"
          minimal
          active={active === 'tasks'}
          icon={IconNames.GANTT_CHART}
          text="Tasks"
          href="#tasks"
          disabled={!capabilities.hasSqlOrOverlordAccess()}
        />
        <AnchorButton
          className="header-entry"
          minimal
          active={active === 'segments'}
          icon={IconNames.STACKED_CHART}
          text="Segments"
          href="#segments"
          disabled={!capabilities.hasSqlOrCoordinatorAccess()}
        />
        <AnchorButton
          className="header-entry"
          minimal
          active={active === 'services'}
          icon={IconNames.DATABASE}
          text="Services"
          href="#services"
          disabled={!capabilities.hasSqlOrCoordinatorAccess()}
        />
        <Popover2 content={moreViewsMenu} position={Position.BOTTOM_LEFT}>
          <Button
            className="header-entry"
            minimal
            icon={IconNames.MORE}
            active={moreViewsMenuActive}
          />
        </Popover2>
      </NavbarGroup>
      <NavbarGroup align={Alignment.RIGHT}>
        <RestrictedMode
          capabilities={capabilities}
          onUnrestrict={onUnrestrict}
          onUseAutomaticCapabilityDetection={
            capabilitiesOverride ? () => setCapabilitiesOverride(undefined) : undefined
          }
        />
        {capabilitiesOverride && (
          <Popover2
            content={
              <PopoverText>
                <p>
                  The console is running in a manual capability setting mode that assumes a limited
                  set of capabilities rather than detecting all capabilities for the cluster.
                </p>
                <p>
                  Manual capability setting mode is an advanced feature used for testing and for
                  working around issues with the automatic capability detecting logic.
                </p>
                <p>
                  If you are unsure why the console is in this mode, revert to using automatic
                  capability detection.
                </p>
                <p>
                  <Button
                    text="Use automatic capability detection"
                    onClick={() => setCapabilitiesOverride(undefined)}
                    intent={Intent.PRIMARY}
                  />
                </p>
              </PopoverText>
            }
            position={Position.BOTTOM_RIGHT}
          >
            <Button
              icon={IconNames.HIGH_PRIORITY}
              text="Manual capabilty detection"
              intent={Intent.DANGER}
              minimal
            />
          </Popover2>
        )}
        <Popover2 content={configMenu} position={Position.BOTTOM_RIGHT}>
          <Button className="header-entry" minimal icon={IconNames.COG} />
        </Popover2>
        <Popover2 content={helpMenu} position={Position.BOTTOM_RIGHT}>
          <Button className="header-entry" minimal icon={IconNames.HELP} />
        </Popover2>
      </NavbarGroup>
      {aboutDialogOpen && <AboutDialog onClose={() => setAboutDialogOpen(false)} />}
      {doctorDialogOpen && <DoctorDialog onClose={() => setDoctorDialogOpen(false)} />}
      {coordinatorDynamicConfigDialogOpen && (
        <CoordinatorDynamicConfigDialog
          onClose={() => setCoordinatorDynamicConfigDialogOpen(false)}
        />
      )}
      {overlordDynamicConfigDialogOpen && (
        <OverlordDynamicConfigDialog onClose={() => setOverlordDynamicConfigDialogOpen(false)} />
      )}
      {compactionDynamicConfigDialogOpen && (
        <CompactionDynamicConfigDialog
          onClose={() => setCompactionDynamicConfigDialogOpen(false)}
        />
      )}
    </Navbar>
  );
});
