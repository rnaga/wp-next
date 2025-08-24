import { useEffect, useState } from "react";

import * as wpTypes from "@rnaga/wp-node/types";

import { useServerActions } from "@rnaga/wp-next-core/client/hooks/use-server-actions";

import type * as wpCoreTypes from "@rnaga/wp-next-core/types";

import { Select } from "./Select";
import { Typography } from "./Typography";

export const SelectWPTaxonomy = (props: {
  onClick: (taxonomy: wpCoreTypes.actions.Taxonomies[number]) => any;
  onInit: (taxonomy: wpCoreTypes.actions.Taxonomies[number]) => any;
  defaultValue: wpTypes.TaxonomyName;
  size?: "small" | "medium";
}) => {
  const { onClick, onInit, defaultValue, size } = props;
  const { actions, parse } = useServerActions();
  const [taxonomies, setTaxonomies] =
    useState<wpCoreTypes.actions.Taxonomies>();

  useEffect(() => {
    actions.term.taxonomies().then((response) => {
      const [taxonomies] = parse(response);
      setTaxonomies(taxonomies);
      const defaultTaxonomy = taxonomies.find(
        (taxonomy) => taxonomy.name == defaultValue
      );
      defaultTaxonomy && onInit(defaultTaxonomy);
    });
  }, []);

  if (!taxonomies) {
    return <Typography>Loading...</Typography>;
  }

  return (
    <Select
      size={size}
      enum={taxonomies.map((taxonomy) => {
        return {
          label: taxonomy.name,
          value: taxonomy.name,
        };
      })}
      value={defaultValue}
      onChange={(value) => {
        console.log("Selected syntax:", value);
        const index = taxonomies.findIndex(
          (taxonomy) => taxonomy.name === value
        );
        if (index === -1) {
          console.error("Selected taxonomy not found:", value);
          return;
        }

        onClick(taxonomies[index]);
      }}
    />
  );
};
