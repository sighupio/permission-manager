#!/bin/sh

# Copyright (c) 2017-present SIGHUP s.r.l All rights reserved.
# Use of this source code is governed by a BSD-style
# license that can be found in the LICENSE file.

HELM_TAG=$(yq e '.version' ./helm_chart/Chart.yaml)

RELEASE_ID=$(
	curl -sSL \
		-H "Accept: application/vnd.github+json" \
		-H "Authorization: Bearer ${CR_TOKEN}" \
		-H "X-GitHub-Api-Version: 2022-11-28" \
		"https://api.github.com/repos/sighupio/permission-manager/releases/tags/helm-chart-v${HELM_TAG}" | jq '.id'
)

curl -sSL \
	-X PATCH \
	-H "Accept: application/vnd.github+json" \
	-H "Authorization: Bearer ${CR_TOKEN}" \
	-H "X-GitHub-Api-Version: 2022-11-28" \
	"https://api.github.com/repos/sighupio/permission-manager/releases/${RELEASE_ID}" \
	-d "{\"name\":\"Helm Chart v${HELM_TAG}\"}"
