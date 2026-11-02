"use client";

import { startTransition, useActionState, useCallback } from "react";

// Wraps a Server Action for use with a <form onSubmit>. Unlike <form action>,
// React doesn't wipe the fields after the action finishes, so a failed
// validation never loses what the person typed.
//
// Returns [state, onSubmit, pending].
export function useCmsAction(action) {
  const [state, dispatch, pending] = useActionState(action, null);

  const onSubmit = useCallback(
    (event) => {
      event.preventDefault();
      const formData = new FormData(event.currentTarget);
      startTransition(() => dispatch(formData));
    },
    [dispatch],
  );

  return [state, onSubmit, pending];
}
