import React, { createRef } from 'react';
import PropTypes from 'prop-types';
import uuid from 'uuid/v4';
import { List } from 'immutable';
import { connect } from 'react-redux';
import { debounce } from 'lodash';
import styled from 'react-emotion';
import AsyncSelect from 'react-select/lib/Async';
import BaseOption from 'react-select/lib/components/Option';
import EntryLoader from './EntryLoader'

const getOptionValue = option => option.value || option.slug || option

const Option = ({data, ...props}) => (
  <BaseOption {...props}>{data.title}</BaseOption>
)

const MultiValueLabel = ({children, innerProps}) => (
  <div {...innerProps}>
    <EntryLoader {...children}>
      {({isLoading, title, error}) => {
        if(isLoading) return '...'
        if(error) return error
        return title || 'Unknown Entity'
      }}
    </EntryLoader>
  </div>
)

const Select = styled(AsyncSelect)`
  position: relative;
  z-index: 2;
`

const Wrapper = styled('div')`

`

const IndicatorSeparator = () => null
const DropdownIndicator = () => null
const entryMapper = ({data, slug}) => ({...data, value: slug, type: 'option'})

export default class RelationControl extends React.Component {
  static defaultProps = {
    value: List(['vitordino']),
  }

  controlID = uuid();
  select = createRef();

  componentDidUpdate(prevProps){
    if(!this.callback) return
    if(
      this.props.queryHits !== prevProps.queryHits &&
      this.props.queryHits.get(this.controlID)
    ){
      const queryHits = this.props.queryHits.get(this.controlID, [])
      return this.callback(queryHits.map(entryMapper))
    }
  }

  handleChange = (rawValues, action) => {
    const slugs = rawValues.map(value => {
      if(typeof value === 'string') return value
      return value.value
    });
    this.props.onChange(List(slugs));
  };

  loadOptions = debounce((term, callback) => {
    const { field } = this.props;
    const collection = field.get('collection');
    const searchFields = field.get('searchFields').toJS();
    this.callback = value => {
      callback(value)
      this.callback = null
    }
    this.props.query(this.controlID, collection, searchFields, term)
  }, 250);

  handleFocus = () => this.props.setActiveStyle();
  handleBlur = () => this.props.setInactiveStyle();

  handleMenuClose = () => {
    this.handleBlur();
    if(!this.callback) return
    this.props.clearSearch();
    this.callback = null;
  };

  handleMenuOpen = () => {
    this.handleFocus();
  };

  loadEntry = (...args) => this.props.loadEntry(...args)
  formatOptionLabel = (value, {context}) => {
    if(context === 'menu') return value
    if(typeof value === 'string') return {
      slug: value,
      collection: this.props.field.get('collection'),
      loadEntry: this.loadEntry,
    }
    return {entry: value}
  }

  shouldComponentUpdate(prevProps){
    const current = this.props.queryHits.get(this.controlID);
    const previous = prevProps.queryHits.get(this.controlID);
    if(current !== previous) return true
    if(prevProps.forID !== this.props.forID) return true
    if(prevProps.classNameWrapper !== this.props.classNameWrapper) return true
    return false
  }

  render() {
    const {forID, classNameWrapper} = this.props;
    return (
      <Wrapper className={classNameWrapper}>
        <Select
          isMulti
          innerRef={this.select}
          defaultValue={this.props.value.toJS()}
          onChange={this.handleChange}
          components={{
            IndicatorSeparator,
            DropdownIndicator,
            Option,
            MultiValueLabel,
          }}
          cacheOptions={forID}
          onFocus={this.handleFocus}
          onBlur={this.handleBlur}
          formatOptionLabel={this.formatOptionLabel}
          getOptionValue={getOptionValue}
          onMenuClose={this.handleMenuClose}
          onMenuOpen={this.handleMenuOpen}
          loadOptions={this.loadOptions}
        />
      </Wrapper>
    );
  }
}

