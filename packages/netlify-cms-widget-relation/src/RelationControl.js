import React from 'react';
import PropTypes from 'prop-types';
import ImmutablePropTypes from 'react-immutable-proptypes';
import AsyncSelect from 'react-select/lib/Async';
import { debounce, castArray } from 'lodash';
import { List } from 'immutable';
import { reactSelectStyles } from 'netlify-cms-ui-default';

const toJS = item => (hasMethod('toJS')(item) ? item.toJS() : item);
const apply = fn => item => (hasMethod('map')(item) ? item.map(fn) : fn(item));
const hasMethod = method => object => object && typeof object[method] === 'function';
const castString = option => (option && option.value) || option || '';
const castOption = value => (typeof value === 'string' ? { value, label: value } : value);
const getInitial = value => castArray(toJS(apply(castOption)(value)) || []);

export default class RelationControl extends React.Component {
  static propTypes = {
    onChange: PropTypes.func.isRequired,
    forID: PropTypes.string.isRequired,
    value: PropTypes.node,
    field: ImmutablePropTypes.map,
    isFetching: PropTypes.bool,
    fetchID: PropTypes.string,
    query: PropTypes.func.isRequired,
    clearSearch: PropTypes.func.isRequired,
    queryHits: ImmutablePropTypes.map,
    classNameWrapper: PropTypes.string.isRequired,
    setActiveStyle: PropTypes.func.isRequired,
    setInactiveStyle: PropTypes.func.isRequired,
  };

  handleChange = raw => {
    const value = apply(castString)(raw);
    this.props.onChange(typeof value === 'string' ? value : List(value));
  };

  shouldComponentUpdate() {
    return true;
  }

  entryMapper = ({ data } = {}) => {
    const valueField = this.props.field.get('valueField');
    const displayFields = this.props.field.get('displayFields', [valueField]);
    return { value: data[valueField], label: displayFields.map(key => data[key]).join(' ') };
  };

  componentDidUpdate(prevProps) {
    if (!this.callback) return;
    if (
      this.props.queryHits !== prevProps.queryHits &&
      this.props.queryHits.get(this.props.forID)
    ) {
      const queryHits = this.props.queryHits.get(this.props.forID, []);
      return this.callback(queryHits.map(this.entryMapper));
    }
  }

  loadOptions = debounce((term, callback) => {
    const { field, forID } = this.props;
    const collection = field.get('collection');
    const searchFields = field.get('searchFields').toJS();

    this.callback = value => {
      callback(value);
      this.callback = null;
    };
    this.props.query(forID, collection, searchFields, term);
  }, 250);

  handleMenuClose = () => {
    this.props.clearSearch();
    this.callback = null;
  };

  render() {
    const { field, value, forID, classNameWrapper, setActiveStyle, setInactiveStyle } = this.props;
    const isMultiple = field.get('multiple', false);
    const isClearable = !field.get('required', true) || isMultiple;

    return (
      <AsyncSelect
        inputId={forID}
        defaultValue={getInitial(value)}
        onChange={this.handleChange}
        loadOptions={this.loadOptions}
        className={classNameWrapper}
        onFocus={setActiveStyle}
        onBlur={setInactiveStyle}
        styles={reactSelectStyles}
        isMulti={isMultiple}
        isClearable={isClearable}
        openMenuOnClick={false}
        onMenuClose={this.handleMenuClose}
        cacheOptions={forID}
      />
    );
  }
}
