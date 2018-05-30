import PropTypes from 'prop-types';
import React, { Component } from 'react';
import Autosuggest from 'react-autosuggest';
import uuid from 'uuid/v4';
import { List } from 'immutable';
import { connect } from 'react-redux';
import { query, clearSearch } from 'Actions/search';
import { Loader } from 'UI';

class RelationControl extends Component {
  static propTypes = {
    onChange: PropTypes.func.isRequired,
    forID: PropTypes.string.isRequired,
    value: PropTypes.node,
    field: PropTypes.node,
    isFetching: PropTypes.node,
    query: PropTypes.func.isRequired,
    clearSearch: PropTypes.func.isRequired,
    queryHits: PropTypes.oneOfType([
      PropTypes.array,
      PropTypes.object,
    ]),
    classNameWrapper: PropTypes.string.isRequired,
    setActiveStyle: PropTypes.func.isRequired,
    setInactiveStyle: PropTypes.func.isRequired,
    onSuggestionSelected: PropTypes.func.isRequired,
    onSuggestionsFetchRequested: PropTypes.func.isRequired,
    onSuggestionsClearRequested: PropTypes.func.isRequired,
    getSuggestionValue: PropTypes.func.isRequired,
    renderSuggestion: PropTypes.func.isRequired,
    isValid: PropTypes.func.isRequired,
  };

  static defaultProps = {
    value: '',
    onSuggestionSelected(event, {suggestion}){
      console.info(`RelationControl::onSuggestionSelected(${event}, ${{suggestion}})`)
      const value = this.getSuggestionValue(suggestion);
      this.props.onChange(value, {
        [this.props.field.get('collection')]: {[value]: suggestion.data},
      });
    },
    onSuggestionsFetchRequested({value}){
      console.info(`RelationControl::onSuggestionsFetchRequested(${value})`)
      if (value.length < 2) return;
      const {field} = this.props;
      const collection = field.get('collection');
      const searchFields = field.get('searchFields').toJS();
      this.props.query(this.controlID, collection, searchFields, value);
    },
    onSuggestionsClearRequested(){
      console.info(`RelationControl::onSuggestionsClearRequested()`)
      this.props.clearSearch()
    },
    getSuggestionValue(suggestion){
      console.info(`RelationControl::getSuggestionValue(${suggestion})`)
      const {field} = this.props;
      const valueField = field.get('valueField');
      return suggestion.data[valueField];
    },
    renderSuggestion(suggestion){
      console.info(`RelationControl::renderSuggestion(${suggestion})`)
      const {field} = this.props;
      const valueField = field.get('displayFields') || field.get('valueField');
      if (List.isList(valueField)) {
        return (
          <span>
            {valueField.toJS().map(key => <span key={key}>{new String(suggestion.data[key])}{' '}</span>)}
          </span>
        );
      }
      return <span>{new String(suggestion.data[valueField])}</span>;
    },
    isValid(){
      console.info(`RelationControl::isValid()`)
      return true
    },
  }
  constructor(props, ctx){
    super(props, ctx)

    this.controlID = uuid()
    this.didInitialSearch = false

    this.onSuggestionSelected = (...args) => (
      this.props.onSuggestionSelected.apply(this, args)
    )
    this.onSuggestionsFetchRequested = (...args) => (
      this.props.onSuggestionsFetchRequested.apply(this, args)
    )
    this.onSuggestionsClearRequested = (...args) => (
      this.props.onSuggestionsClearRequested.apply(this, args)
    )
    this.getSuggestionValue = (...args) => (
      this.props.getSuggestionValue.apply(this, args)
    )
    this.renderSuggestion = (...args) => (
      this.props.renderSuggestion.apply(this, args)
    )
    this.isValid = (...args) => (
      this.props.isValid.apply(this, args)
    )
  }

  onChange = (event, { newValue }) => {
    this.props.onChange(newValue);
  };

  componentDidMount() {
    const { value, field } = this.props;
    if (value) {
      const collection = field.get('collection');
      const searchFields = field.get('searchFields').toJS();
      this.props.query(this.controlID, collection, searchFields, value);
    }
  }

  componentWillReceiveProps(nextProps) {
    if (this.didInitialSearch) return;
    if (nextProps.queryHits !== this.props.queryHits && nextProps.queryHits.get && nextProps.queryHits.get(this.controlID)) {
      this.didInitialSearch = true;
      const suggestion = nextProps.queryHits.get(this.controlID);
      if (suggestion && suggestion.length === 1) {
        const val = this.getSuggestionValue(suggestion[0]);
        this.props.onChange(val, { [nextProps.field.get('collection')]: { [val]: suggestion[0].data } });
      }
    }
  }

  render() {
    const {
      value,
      isFetching,
      forID,
      queryHits,
      classNameWrapper,
      setActiveStyle,
      setInactiveStyle
    } = this.props;

    const inputProps = {
      placeholder: '',
      value: value || '',
      onChange: this.onChange,
      id: forID,
      className: classNameWrapper,
      onFocus: setActiveStyle,
      onBlur: setInactiveStyle,
    };

    const suggestions = (queryHits.get) ? queryHits.get(this.controlID, []) : [];

    return (
      <div>
        <Autosuggest
          suggestions={suggestions}
          onSuggestionsFetchRequested={this.onSuggestionsFetchRequested}
          onSuggestionsClearRequested={this.onSuggestionsClearRequested}
          onSuggestionSelected={this.onSuggestionSelected}
          getSuggestionValue={this.getSuggestionValue}
          renderSuggestion={this.renderSuggestion}
          inputProps={inputProps}
          focusInputOnSuggestionClick={false}
        />
        <Loader active={isFetching === this.controlID} />
      </div>
    );
  }
}

function mapStateToProps(state, ownProps) {
  const { className } = ownProps;
  const isFetching = state.search.get('isFetching');
  const queryHits = state.search.get('queryHits');
  return { isFetching, queryHits, className };
}

export default connect(
  mapStateToProps,
  {
    query,
    clearSearch,
  },
  null,
  {
    withRef: true,
  }
)(RelationControl);
