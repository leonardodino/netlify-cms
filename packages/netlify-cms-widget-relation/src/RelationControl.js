import React from 'react';
import PropTypes from 'prop-types';
import { injectGlobal } from 'react-emotion';
import Autosuggest from 'react-autosuggest';
import uuid from 'uuid/v4';
import { List } from 'immutable';
import { debounce } from 'lodash';
import { Loader, components } from 'netlify-cms-ui-default';

injectGlobal`
  .react-autosuggest__container {
    position: relative;
  }

  .react-autosuggest__suggestions-container {
    display: none;
  }

  .react-autosuggest__container--open .react-autosuggest__suggestions-container {
    ${components.dropdownList}
    position: absolute;
    display: block;
    top: 51px;
    width: 100%;
    z-index: 2;
  }

  .react-autosuggest__suggestion {
    ${components.dropdownItem}
  }

  .react-autosuggest__suggestions-list {
    margin: 0;
    padding: 0;
    list-style-type: none;
  }

  .react-autosuggest__suggestion {
    cursor: pointer;
    padding: 10px 20px;
  }

  .react-autosuggest__suggestion--focused {
    background-color: #ddd;
  }
`;

export default class RelationControl extends React.Component {
  static propTypes = {
    onChange: PropTypes.func.isRequired,
    forID: PropTypes.string.isRequired,
    value: PropTypes.node,
    field: PropTypes.node,
    isFetching: PropTypes.bool,
    fetchID: PropTypes.string,
    query: PropTypes.func.isRequired,
    clearSearch: PropTypes.func.isRequired,
    queryHits: PropTypes.oneOfType([PropTypes.array, PropTypes.object]),
    classNameWrapper: PropTypes.string.isRequired,
    setActiveStyle: PropTypes.func.isRequired,
    setInactiveStyle: PropTypes.func.isRequired,
    onSuggestionSelected: PropTypes.func.isRequired,
    onSuggestionsFetchRequested: PropTypes.func.isRequired,
    onSuggestionsClearRequested: PropTypes.func.isRequired,
    getSuggestionValue: PropTypes.func.isRequired,
    renderSuggestion: PropTypes.func.isRequired,
    isValid: PropTypes.func.isRequired,
    renderInputComponent: PropTypes.func.isRequired,
    valueToFieldString: PropTypes.func.isRequired,
    shouldRenderSuggestions: PropTypes.func.isRequired,
  };

  static defaultProps = {
    value: '',
    renderInputComponent(props) {
      return <input {...props} />;
    },
    valueToFieldString(value) {
      return String(value);
    },
    shouldRenderSuggestions(value) {
      return value.trim().length;
    },
    onSuggestionSelected(event, { suggestion }) {
      const value = this.getSuggestionValue(suggestion);
      this.props.onChange(value, {
        [this.props.field.get('collection')]: { [value]: suggestion.data },
      });
    },
    onSuggestionsFetchRequested({ value }) {
      // if (value.length < 2) return;
      const { field } = this.props;
      const collection = field.get('collection');
      const searchFields = field.get('searchFields').toJS();
      this.props.query(this.controlID, collection, searchFields, value);
    },
    onSuggestionsClearRequested() {
      this.props.clearSearch();
    },
    getSuggestionValue(suggestion) {
      const { field } = this.props;
      const valueField = field.get('valueField');
      return suggestion.data[valueField];
    },
    renderSuggestion(suggestion) {
      const { field } = this.props;
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
    isValid() {
      return true;
    },
  };

  constructor(props, ctx) {
    super(props, ctx);
    this.controlID = uuid();
    this.didInitialSearch = false;

    this.renderInputComponent = (...args) => (
      this.props.renderInputComponent.apply(this, args)
    );
    this.valueToFieldString = (...args) => (
      this.props.valueToFieldString.apply(this, args)
    );
    this.shouldRenderSuggestions = (...args) => (
      this.props.shouldRenderSuggestions.apply(this, args)
    );
    this.onSuggestionSelected = (...args) => (
      this.props.onSuggestionSelected.apply(this, args)
    );
    this.onSuggestionsFetchRequested = (...args) => (
      this.props.onSuggestionsFetchRequested.apply(this, args)
    );
    this.onSuggestionsClearRequested = (...args) => (
      this.props.onSuggestionsClearRequested.apply(this, args)
    );
    this.getSuggestionValue = (...args) => (
      this.props.getSuggestionValue.apply(this, args)
    );
    this.renderSuggestion = (...args) => (
      this.props.renderSuggestion.apply(this, args)
    );
    this.isValid = (...args) => (
      this.props.isValid.apply(this, args)
    );
  }

  componentDidMount() {
    const { value, field } = this.props;
    if (value) {
      const collection = field.get('collection');
      const searchFields = field.get('searchFields').toJS();
      this.props.query(this.controlID, collection, searchFields, value);
    }
  }

  componentDidUpdate(prevProps) {
    /**
     * Load extra post data into the store after first query.
     */
    if (this.didInitialSearch) return;
    if (
      this.props.queryHits !== prevProps.queryHits &&
      this.props.queryHits.get &&
      this.props.queryHits.get(this.controlID)
    ) {
      this.didInitialSearch = true;
      const suggestion = this.props.queryHits.get(this.controlID);
      if (suggestion && suggestion.length === 1) {
        const val = this.getSuggestionValue(suggestion[0]);
        this.props.onChange(val, {
          [this.props.field.get('collection')]: { [val]: suggestion[0].data },
        });
      }
    }
  }

  onChange = (event, { newValue }) => {
    this.props.onChange(newValue);
  };

  onSuggestionSelected = (event, { suggestion }) => {
    const value = this.getSuggestionValue(suggestion);
    this.props.onChange(value, {
      [this.props.field.get('collection')]: { [value]: suggestion.data },
    });
  };

  onSuggestionsFetchRequested = debounce(({ value }) => {
    if (value.length < 2) return;
    const { field } = this.props;
    const collection = field.get('collection');
    const searchFields = field.get('searchFields').toJS();
    this.props.query(this.controlID, collection, searchFields, value);
  }, 500);

  onSuggestionsClearRequested = () => {
    this.props.clearSearch();
  };

  getSuggestionValue = suggestion => {
    const { field } = this.props;
    const valueField = field.get('valueField');
    return suggestion.data[valueField];
  };

  renderSuggestion = suggestion => {
    const { field } = this.props;
    const valueField = field.get('displayFields') || field.get('valueField');
    if (List.isList(valueField)) {
      return (
        <span>
          {valueField.toJS().map(key => (
            <span key={key}>{new String(suggestion.data[key])} </span>
          ))}
        </span>
      );
    }
    return <span>{new String(suggestion.data[valueField])}</span>;
  };

  render() {
    const {
      value,
      isFetching,
      fetchID,
      forID,
      queryHits,
      classNameWrapper,
      setActiveStyle,
      setInactiveStyle,
    } = this.props;

    const inputProps = {
      placeholder: '',
      value: this.valueToFieldString(value || ''),
      onChange: this.onChange,
      id: forID,
      className: classNameWrapper,
      onFocus: setActiveStyle,
      onBlur: setInactiveStyle,
    };

    const suggestions = queryHits.get ? queryHits.get(this.controlID, []) : [];

    return (
      <div>
        <Autosuggest
          suggestions={suggestions}
          renderInputComponent={this.renderInputComponent}
          shouldRenderSuggestions={this.shouldRenderSuggestions}
          onSuggestionsFetchRequested={this.onSuggestionsFetchRequested}
          onSuggestionsClearRequested={this.onSuggestionsClearRequested}
          onSuggestionSelected={this.onSuggestionSelected}
          getSuggestionValue={this.getSuggestionValue}
          renderSuggestion={this.renderSuggestion}
          inputProps={inputProps}
          focusInputOnSuggestionClick={false}
        />
        <Loader active={isFetching && this.controlID === fetchID} />
      </div>
    );
  }
}
