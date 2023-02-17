// Ideally this would not be hardcoded, but we are out of time
export const isLeaderApp = (fields) => {
  return fields?.length > 3 && fields[3].response
}

export const isCrooApp = (fields) => {
  return fields?.length > 4 && fields[4].response
}
