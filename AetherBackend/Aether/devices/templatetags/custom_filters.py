from django import template

register = template.Library()

@register.filter
def get_item(dictionary, key):
    """Custom filter to get the value from a dictionary by key."""
    return dictionary.get(key)


@register.filter
def as_comma_separated(value):
    """Clean a string formatted like a Python list into a readable format."""
    if isinstance(value, str):
        cleaned = value.strip("[]").replace("'", "").replace('"', "")
        return cleaned
    return value 