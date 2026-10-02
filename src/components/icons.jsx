/* eslint-disable react/prop-types */
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faArrowRight,
  faBars,
  faCapsules,
  faEnvelope,
  faPhone,
  faXmark,
} from '@fortawesome/free-solid-svg-icons'

/**
 * Thin wrappers so components can use `<IconName className="..." />` without
 * every caller needing to import FontAwesomeIcon and an icon object.
 */
const icon = (definition, defaultClassName = 'h-5 w-5') => {
  const Component = ({ className, ...rest }) => (
    <FontAwesomeIcon icon={definition} className={className ?? defaultClassName} {...rest} />
  )

  Component.displayName = definition.iconName

  return Component
}

export const IconArrow = icon(faArrowRight)
export const IconBars = icon(faBars)
export const IconCapsules = icon(faCapsules)
export const IconMail = icon(faEnvelope)
export const IconPhone = icon(faPhone)
export const IconClose = icon(faXmark)

export { FontAwesomeIcon }