import { type } from "arktype"

export const ProjectTypeParser = type({
    id: "string",
    name: "string",
    version: "string",
    description: "string",
    createdAt: "Date",
    updatedAt: "Date",
})

type ProjectType = typeof ProjectTypeParser.infer;

export interface IProject extends ProjectType { }