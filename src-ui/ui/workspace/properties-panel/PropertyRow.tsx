import { BaseProperty, BooleanPropertyClass, EnumPropertyClass, ImageSourcePropertyClass, NumberPropertyClass, Point2DPropertyClass, StringPropertyClass } from "@/editor/properties/properties";
import { BooleanPropertyEditor } from "@/ui/components/property-editor/BooleanPropertyEditor";
import { EnumPropertyEditor } from "@/ui/components/property-editor/EnumPropertyEditor";
import { ImageSourcePropertyEditor } from "@/ui/components/property-editor/ImageSourcePropertyEditor";
import { NumberPropertyEditor } from "@/ui/components/property-editor/NumberPropertyEditor";
import { Point2DPropertyEditor } from "@/ui/components/property-editor/Point2DPropertyEditor";
import { SliderPropertyEditor } from "@/ui/components/property-editor/SliderPropertyEditor";
import { StringPropertyEditor } from "@/ui/components/property-editor/StringPropertyEditor";

type PropertyRowProps = {
    property: BaseProperty<any>;
}
export default function PropertyRow({ property }: PropertyRowProps) {
    if (property instanceof StringPropertyClass) {
        return <StringPropertyEditor key={property.id} property={property} />
    } else if (property instanceof NumberPropertyClass) {
        if (property.slider) {
            return <SliderPropertyEditor key={property.id} property={property} slider={property.slider} />
        } else {
            return <NumberPropertyEditor key={property.id} property={property} />
        }
    } else if (property instanceof BooleanPropertyClass) {
        return <BooleanPropertyEditor key={property.id} property={property} />
    } else if (property instanceof EnumPropertyClass) {
        return <EnumPropertyEditor key={property.id} property={property} />
    } else if (property instanceof Point2DPropertyClass) {
        return <Point2DPropertyEditor key={property.id} property={property} />
    } else if (property instanceof ImageSourcePropertyClass) {
        return <ImageSourcePropertyEditor key={property.id} property={property} />
    }
    return null;
}
