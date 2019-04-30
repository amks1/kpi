import _ from 'underscore';
import React from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';
import reactMixin from 'react-mixin';
import autoBind from 'react-autobind';
import Reflux from 'reflux';
import TagsInput from 'react-tagsinput';
import classNames from 'classnames';
import Select from 'react-select';
import Checkbox from 'js/components/checkbox';
import TextBox from 'js/components/textbox';
import mixins from 'js/mixins';
import stores from 'js/stores';
import actions from 'js/actions';
import bem from 'js/bem';
import {
  t,
  parsePermissions,
  stringToColor,
  anonUsername
} from 'js/utils';
import {
  AVAILABLE_PERMISSIONS
} from 'js/constants';

// parts
import CopyTeamPermissions from './copyTeamPermissions';

var availablePermissions = [
  {value: 'view', label: t('View Form')},
  {value: 'change', label: t('Edit Form')},
  {value: 'view_submissions', label: t('View Submissions')},
  {value: 'add_submissions', label: t('Add Submissions')},
  {value: 'change_submissions', label: t('Edit Submissions')},
  {value: 'validate_submissions', label: t('Validate Submissions')}
];

class UserPermissionEditor extends React.Component {
  constructor(props) {
    super(props);
    autoBind(this);

    this.state = {
      username: '',
      usernameError: '',
      view: false,
      change: false,
      view_submissions: false,
      add_submissions: false,
      change_submissions: false,
      validate_submissions: false,
      restricted_view: false,
      restricted_view_users: []
    };
  }

  componentDidMount() {
    // TODO set permissions if given (i.e. editing existing permissions,
    // not giving new)
  }

  togglePerm(permId) {
    let newPerms = {};
    newPerms[permId] = !this.state[permId];
    this.setState(newPerms);
  }

  usernameChange(username) {
    this.setState({username: username});
  }

  restrictedUsersChange(users) {
    this.setState({restricted_view_users: users});
  }

  validateUsername(username) {
    return username !== 'leszek';
  }

  onValidateUsernameReject(arr) {
    console.log(arr);
  }

  render() {
    const restrictedViewUsersInputProps = {
      placeholder: t('Add username(s)')
    };

    return (
      <bem.FormModal__item>
        {t('Grant permissions to')}

        <TextBox
          placeholder={t('username')}
          errors={this.state.usernameError}
          value={this.state.username}
          onChange={this.usernameChange}
        />

        <Checkbox
          checked={this.state.view}
          onChange={this.togglePerm.bind(this, 'view')}
          label={AVAILABLE_PERMISSIONS.get('view')}
        />

        {this.state.view === true &&
          <div>
            <Checkbox
              checked={this.state.restricted_view}
              onChange={this.togglePerm.bind(this, 'restricted_view')}
              label={t('Restrict to submissions made by certain users')}
            />

            {this.state.restricted_view === true &&
              <TagsInput
                value={this.state.restricted_view_users}
                onChange={this.restrictedUsersChange}
                validate={this.validateUsername}
                onValidationReject={this.onValidateUsernameReject}
                inputProps={restrictedViewUsersInputProps}
              />
            }
          </div>
        }

        <Checkbox
          checked={this.state.change}
          onChange={this.togglePerm.bind(this, 'change')}
          label={AVAILABLE_PERMISSIONS.get('change')}
        />

        <Checkbox
          checked={this.state.view_submissions}
          onChange={this.togglePerm.bind(this, 'view_submissions')}
          label={AVAILABLE_PERMISSIONS.get('view_submissions')}
        />

        <Checkbox
          checked={this.state.add_submissions}
          onChange={this.togglePerm.bind(this, 'add_submissions')}
          label={AVAILABLE_PERMISSIONS.get('add_submissions')}
        />

        <Checkbox
          checked={this.state.change_submissions}
          onChange={this.togglePerm.bind(this, 'change_submissions')}
          label={AVAILABLE_PERMISSIONS.get('change_submissions')}
        />

        <Checkbox
          checked={this.state.validate_submissions}
          onChange={this.togglePerm.bind(this, 'validate_submissions')}
          label={AVAILABLE_PERMISSIONS.get('validate_submissions')}
        />
      </bem.FormModal__item>
    );
  }
}

class UserPermDiv extends React.Component {
  constructor(props) {
    super(props);
    autoBind(this);
  }
  removePermissions() {
    // removing view permission will include all other permissions
    actions.permissions.removePerm({
      permission_url: this.props.can.view.url,
      content_object_uid: this.props.uid
    });
  }
  PermOnChange(perm) {
    var cans = this.props.can;
    if (perm) {
      var permName = perm.value;
      this.setPerm(permName, this.props);
      if (permName == 'view' && cans.change)
        this.removePerm('change', cans.change, this.props.uid);
    } else {
      if (cans.view)
        this.removePerm('view', cans.view, this.props.uid);
      if (cans.change)
        this.removePerm('change', cans.change, this.props.uid);
    }

  }
  render () {
    var initialsStyle = {
      background: `#${stringToColor(this.props.username)}`
    };

    var cans = [];
    for (var key in this.props.can) {
      let perm = availablePermissions.find(function (d) {return d.value === key});
      if (perm && perm.label)
        cans.push(perm.label);
    }

    const cansString = cans.sort().join(', ');

    return (
      <bem.UserRow m={cans.length > 0 ? 'regular' : 'deleted'}>
        <bem.UserRow__avatar>
          <bem.AccountBox__initials style={initialsStyle}>
            {this.props.username.charAt(0)}
          </bem.AccountBox__initials>
        </bem.UserRow__avatar>
        <bem.UserRow__name>
          {this.props.username}
        </bem.UserRow__name>
        <bem.UserRow__role title={cansString}>
          {cansString}
        </bem.UserRow__role>
        <bem.UserRow__cancel onClick={this.removePermissions}>
          <i className='k-icon k-icon-trash' />
        </bem.UserRow__cancel>
      </bem.UserRow>
      );
  }
}

reactMixin(UserPermDiv.prototype, mixins.permissions);

class PublicPermDiv extends React.Component {
  constructor(props) {
    super(props);
    autoBind(this);
  }
  togglePerms(permRole) {
    var permission = this.props.publicPerms.filter(function(perm){ return perm.permission === permRole })[0];

    if (permission) {
      actions.permissions.removePerm({
        permission_url: permission.url,
        content_object_uid: this.props.uid
      });
    } else {
      actions.permissions.assignPerm({
        username: anonUsername,
        uid: this.props.uid,
        kind: this.props.kind,
        objectUrl: this.props.objectUrl,
        role: permRole === 'view_asset' ? 'view' : permRole
      });
    }
  }
  render () {
    var uid = this.props.uid;

    var href = `#/forms/${uid}`;
    var url = `${window.location.protocol}//${window.location.host}/${href}`;

    var anonCanView = this.props.publicPerms.filter(function(perm){ return perm.permission === 'view_asset' })[0];
    var anonCanViewData = this.props.publicPerms.filter(function(perm){ return perm.permission === 'view_submissions' })[0];

    return (
      <bem.FormModal__item m='permissions'>
        <bem.FormModal__item m='perms-link'>
          <Checkbox
            checked={anonCanView ? true : false}
            onChange={this.togglePerms.bind(this, 'view_asset')}
            label={t('Share by link')}
          />
          { anonCanView &&
            <bem.FormModal__item m='shareable-link'>
              <label>
                {t('Shareable link')}
              </label>
              <input type='text' value={url} readOnly />
            </bem.FormModal__item>
          }
        </bem.FormModal__item>
        { this.props.deploymentActive &&
          <bem.FormModal__item m='perms-public-data'>
            <Checkbox
              checked={anonCanViewData ? true : false}
              onChange={this.togglePerms.bind(this, 'view_submissions')}
              label={t('Share data publicly')}
            />
          </bem.FormModal__item>
        }
      </bem.FormModal__item>
    );
  }
};

reactMixin(PublicPermDiv.prototype, mixins.permissions);

class SharingForm extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      userInputStatus: false,
      permInput: 'view'
    };
    this._usernameCheckDebounced = _.debounce(this._usernameCheckCall.bind(this), 500);
    autoBind(this);
  }
  assetChange (data) {
    var uid = this.props.uid || this.currentAssetID(),
      asset = data[uid];

    if (asset) {
      this.setState({
        asset: asset,
        permissions: asset.permissions,
        owner: asset.owner__username,
        pperms: parsePermissions(asset.owner__username, asset.permissions),
        public_permissions: asset.permissions.filter(function(perm){ return perm.user__username === anonUsername }),
        related_users: stores.asset.relatedUsers[uid]
      });
    }
  }
  componentDidMount () {
    this.listenTo(stores.userExists, this.userExistsStoreChange);
    if (this.props.uid) {
      actions.resources.loadAsset({id: this.props.uid});
    }
    this.listenTo(stores.asset, this.assetChange);
  }
  userExistsStoreChange (checked, result) {
    var inpVal = this.usernameFieldValue();
    if (inpVal === result) {
      var newStatus = checked[result] ? 'success' : 'error';
      this.setState({
        userInputStatus: newStatus
      });
    }
  }
  usernameField () {
    return ReactDOM.findDOMNode(this.refs.usernameInput);
  }
  usernameFieldValue () {
    return this.usernameField().value;
  }
  usernameCheck (evt) {
    evt.persist();
    this._usernameCheckDebounced(evt);
  }
  _usernameCheckCall (evt) {
    var username = evt.target.value;
    if (username && username.length > 1) {
      var result = stores.userExists.checkUsername(username);
      if (result === undefined) {
        actions.misc.checkUsername(username);
      } else {
        this.setState({
          userInputStatus: result ? 'success' : 'error'
        });
      }
    } else {
      this.setState({
        userInputStatus: false
      });
    }
  }
  addInitialUserPermission (evt) {
    evt.preventDefault();
    var username = this.usernameFieldValue();
    if (stores.userExists.checkUsername(username)) {
      actions.permissions.assignPerm({
        username: username,
        uid: this.state.asset.uid,
        kind: this.state.asset.kind,
        objectUrl: this.props.objectUrl,
        role: this.state.permInput.value
      });
      this.usernameField().value = '';
    }
  }
  updatePermInput(perm) {
    this.setState({
      permInput: perm
    });
  }

  toggleAddUser() {
    this.setState({isAddUserEditorVisible: !this.state.isAddUserEditorVisible});
  }

  render () {
    var inpStatus = this.state.userInputStatus;
    if (!this.state.pperms) {
      return (
          <bem.Loading>
            <bem.Loading__inner>
              <i />
              {t('loading...')}
            </bem.Loading__inner>
          </bem.Loading>
        );
    }
    var _perms = this.state.pperms;
    var perms = this.state.related_users.map(function(username){
      var currentPerm = _perms.filter(function(p){
        return p.username === username;
      })[0];
      if (currentPerm) {
        return currentPerm;
      } else {
        return {
          username: username,
          can: {}
        };
      }
    });

    var btnKls = classNames('mdl-button', 'mdl-button--raised', inpStatus === 'success' ? 'mdl-button--colored' : 'mdl-button--disabled');

    let uid = this.state.asset.uid,
        kind = this.state.asset.kind,
        asset_type = this.state.asset.asset_type,
        objectUrl = this.state.asset.url,
        name = this.state.asset.name;

    if (!perms) {
      return (
          <p>loading</p>
        );
    }

    var initialsStyle = {
      background: `#${stringToColor(this.state.asset.owner__username)}`
    };

    if (asset_type != 'survey') {
      availablePermissions = [
        {value: 'view', label: t('View')},
        {value: 'change', label: t('Edit')},
      ];
    }

    return (
      <bem.FormModal>
        <bem.FormModal__item>
          <bem.Modal__subheader>
            {name}
          </bem.Modal__subheader>
          <bem.FormView__cell m='label'>
            {t('Who has access')}
          </bem.FormView__cell>
          <bem.UserRow>
            <bem.UserRow__avatar>
              <bem.AccountBox__initials style={initialsStyle}>
                {this.state.asset.owner__username.charAt(0)}
              </bem.AccountBox__initials>
            </bem.UserRow__avatar>
            <bem.UserRow__name>
              <div>{this.state.asset.owner__username}</div>
            </bem.UserRow__name>
            <bem.UserRow__role>{t('is owner')}</bem.UserRow__role>
          </bem.UserRow>

          {perms.map((perm)=> {
            return <UserPermDiv key={`perm.${uid}.${perm.username}`} ref={perm.username} uid={uid} kind={kind} objectUrl={objectUrl} {...perm} />;
          })}

        </bem.FormModal__item>

        <bem.FormModal__form
          onSubmit={this.addInitialUserPermission}
          className='sharing-form__user'
        >
          {!this.state.isAddUserEditorVisible &&
            <bem.Button
              m={['raised', 'colored']}
              onClick={this.toggleAddUser}
            >
              {t('Add user')}
            </bem.Button>
          }
          {this.state.isAddUserEditorVisible &&
            <bem.FormModal__item m='gray-row'>
              <bem.Button
                m='icon'
                onClick={this.toggleAddUser}
              >
                <i className='k-icon k-icon-close'/>
              </bem.Button>

              <UserPermissionEditor />
            </bem.FormModal__item>
          }

          <bem.FormModal__item m={['gray-row', 'flexed-row', 'invite-collaborators']}>
            <input type='text'
              id='permsUser'
              ref='usernameInput'
              placeholder={t('Enter a username')}
              onKeyUp={this.usernameCheck}
              onChange={this.usernameCheck}
            />
            <Select
              id='permGiven'
              ref='permInput'
              value={this.state.permInput}
              isClearable={false}
              options={availablePermissions}
              onChange={this.updatePermInput}
              className='kobo-select'
              classNamePrefix='kobo-select'
              menuPlacement='auto'
            />
            <button className={btnKls}>
              {t('invite')}
            </button>
          </bem.FormModal__item>
        </bem.FormModal__form>

        { kind != 'collection' && asset_type == 'survey' &&
          <bem.FormView__cell>
            <bem.FormView__cell m='label'>
              {t('Select share settings')}
            </bem.FormView__cell>
            <PublicPermDiv
              uid={uid}
              publicPerms={this.state.public_permissions}
              kind={kind}
              objectUrl={objectUrl}
              deploymentActive={this.state.asset.deployment__active}
            />
          </bem.FormView__cell>
        }

        { kind != 'collection' && Object.keys(stores.allAssets.byUid).length >= 2 &&
          <bem.FormView__cell m='copy-team-permissions'>
            <CopyTeamPermissions uid={uid}/>
          </bem.FormView__cell>
        }
      </bem.FormModal>
    );
  }
};

SharingForm.contextTypes = {
  router: PropTypes.object
};

reactMixin(SharingForm.prototype, mixins.permissions);
reactMixin(SharingForm.prototype, mixins.contextRouter);
reactMixin(SharingForm.prototype, Reflux.ListenerMixin);

export default SharingForm;
