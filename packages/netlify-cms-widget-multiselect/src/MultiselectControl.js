import React from 'react';
import PropTypes from 'prop-types';
import uuid from 'uuid/v4';
import { List } from 'immutable';
import { connect } from 'react-redux';
import { debounce } from 'lodash';
import AsyncSelect from 'react-select/lib/Async';

var STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;
var ARGUMENT_NAMES = /([^\s,]+)/g;
function getParamNames(func) {
  var fnStr = func.toString().replace(STRIP_COMMENTS, '');
  var result = fnStr.slice(fnStr.indexOf('(')+1, fnStr.indexOf(')')).match(ARGUMENT_NAMES);
  if(result === null)
     result = [];
  return result;
}

export default class RelationControl extends React.Component {
  controlID = uuid();
  state = { inputText: '' }

  componentDidMount(){
     // this.props.query(this.controlID, 'posts', ['title', 'body'], '')
  }

  componentDidUpdate(prevProps){
    const {inputText} = this.state
    console.log(inputText, this.controlID, this.props.queryHits)
    if(
      this.props.queryHits !== prevProps.queryHits &&
      this.props.queryHits.get(this.controlID)
    ){
      const options = this.props.queryHits.get(this.controlID, []).map(
        (entry) => ({value: entry.slug, label: entry.data.title})
      )
      console.log(options)
      this.callback && this.callback(options)
      return
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

  onSuggestionsFetchRequested = debounce((term, callback) => {
    const { field } = this.props;
    const collection = field.get('collection');
    const searchFields = field.get('searchFields').toJS();
    this.callback = value => {
      callback(value)
      this.callback = null
    }
    this.props.query(this.controlID, collection, searchFields, term)
  }, 250);

  onSuggestionsClearRequested = () => {
    this.props.clearSearch();
  };

  valueToFieldString = () => {
    return '[]'
  }

  handleInputChange = (inputText) => {
    this.setState(state => ({inputText}))
  }

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

  shouldComponentUpdate(){
    return true
  }

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
      onChange: this.onChange,
      id: forID,
      className: classNameWrapper,
      onFocus: setActiveStyle,
      onBlur: setInactiveStyle,
    };

    return (
      <div className={classNameWrapper}>
        <AsyncSelect
          isMulti
          cacheOptions={forID}
          loadOptions={this.onSuggestionsFetchRequested}
        />
        <pre>
          {JSON.stringify({...this.props}, null, 2)+'\n\n'}
        </pre>
      </div>
    );
  }
}

