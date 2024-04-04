export declare type ChartType = 'line' | 'area' | 'pie' | "donut" | "radialBar" | "polarArea" | 'bar' | 'treemap' | 'funnel' | 'pyramid' | string;

export function values<T>(...values: T[]): DataProvider<T> {
    return (o, idx)=>{ //this[single]=true
        if(idx < values.length){
            return values[idx];
        }
        throw `idx=${idx} out of values=${values}`;
    }; 
}

export function field<T>(name: string): DataProvider<T> {
    return o=> o[name];
}

export function mapField<T>(name: string, map: Map<any, T>): DataProvider<T> {
    return o=> map.get(o[name]);
}

export function joinFields(separator: string = '_', ...names: string[]): DataProvider<string> {
    return combineFields(joiner(separator), names);
}

export function combineFields<T>(combiner: (args: any[])=> T, names: string[]): DataProvider<T> {
    return o=> combiner(names.map(f=> o[f]).filter(nonUndefined));
}

export function joinProviders<T>(separator: string = '_', ...providers: DataProvider<T>[]): DataProvider<string> {
    return combineProviders(joiner(separator), ...providers);
}

export function combineProviders<T,R>(combiner: (args: T[])=> R, ...providers: DataProvider<T>[]): DataProvider<R> {
    return (o,i)=> combiner(providers.map(p=> p(o,i)).filter(nonUndefined));
}

export function joiner(separator: string = '_') : (args: any[])=> string {
    return args=> args.join(separator);
}

export function rangeFields<T>(minName: string, maxName: string): DataProvider<T[]> {
    return (o, i)=> {
        let min = (<DataProvider<T>>field(minName))(o,i);
        let max = (<DataProvider<T>>field(maxName))(o,i);
        return nonUndefined(min) && nonUndefined(max) ? [min, max] : undefined;
    };
}

export function buildSingleSerieChart<X extends XaxisType, Y extends YaxisType>(objects: any[], provider: ChartProvider<X,Y>, defaultValue?: Y) : CommonChart<X,Y|Coordinate2D> {
    if(objects?.length > 1 && (provider.series?.length > 1 || typeof provider.series[0].data.x == 'function')){
        provider = {...provider, //pivot & merge => single serie
            series:provider.series.map(s=>({
                data:{ 
                    x:<DataProvider<X>> combineProviders(joiner(), s.data.x, resolveDataProvider(s.name)), // TODO change cast
                    y:s.data.y
                },
                color: s.color
                //no unit
            }))
        };
    }
    return buildChart(objects, provider, defaultValue);
}

export function buildChart<X extends XaxisType, Y extends YaxisType>(objects: any[], provider: ChartProvider<X,Y>, defaultValue?: Y) : CommonChart<X,Y|Coordinate2D> {
    var mappers = provider.pivot ?
        provider.series.map(m=>({
            name: resolveDataProvider(m.data.x),
            data:{x: resolveDataProvider(m.name, ''), y: m.data.y},
        })) : provider.series;
    var chart = newChart(provider);
    if(!provider.continue){
        chart.categories = distinct(objects, mappers.map(m=> m.data.x));
        if(provider.xorder){
            chart.categories.sort(naturalComparator(provider.xorder))
        }
    }
    var series = {};
    mappers.forEach(m=> {
        var np = resolveDataProvider(m.name);
        var sp = resolveDataProvider(m.stack);
        var cp = resolveDataProvider(m.color);
        objects.forEach((o,i)=>{
            var name = np(o,i) || ''; //can't use undefined as a map key
            if(!series[name]){ //init serie
                series[name] = {data: []};
                var stack = sp(o, i);
                var color = cp(o, i);
                name  && (series[name].name  = name);
                stack && (series[name].stack = stack);
                color && (series[name].color = color);            
            }
            if(provider.continue){
                series[name].data.push({x: m.data.x(o,i), y: requireNonUndefined(m.data.y(o,i), defaultValue)});
            }
            else{
                var key = m.data.x(o,i);
                var idx = chart.categories.indexOf(key);
                if(idx > -1){ //if !exist
                    series[name].data[idx] = requireNonUndefined(m.data.y(o,i), defaultValue);
                }
                else{
                    throw `'${key}' not part of categories : ${chart.categories}`;
                }
            }
        });
    })
    chart.series = Object.values(series);
    if(provider.continue && provider.xorder){
        chart.series.forEach(s=> s.data.sort(naturalFieldComparator(provider.xorder, field('x'))));
    }
    return chart;
}

function newChart<X extends XaxisType, Y extends YaxisType>(provider: ChartProvider<X,Y>) : CommonChart<X,Y>{
    return Object.entries(provider)
    .filter(e=> ['series'].indexOf(e[0])<0)
    .reduce((acc,e)=>{acc[e[0]] = e[1]; return acc;}, {series:[]})
}

function resolveDataProvider<T>(provider?: T | DataProvider<T>, defaultValue?: T): DataProvider<T> {
    return !provider
        ? (o,i)=> defaultValue
        : typeof provider == 'function'
            ? <DataProvider<T>> provider 
            : (o,i)=> provider;
}

export function distinct<T>(objects: any[], providers : DataProvider<T>[]) : T[] { // T == XaxisType
    var categs = new Set<T>();
    providers.forEach(p=> objects.forEach((o,i)=> categs.add(p(o,i))));
    return [...categs];
}

function nonUndefined(o: any): boolean {
    return !isUndefined(o);
}

function requireNonUndefined<T>(o: T, elseValue: T) : T{
    return isUndefined(o) ? elseValue : o;
}

function isUndefined(o: any): boolean {
    return o == undefined; 
}


export interface ChartProvider<X extends XaxisType, Y extends YaxisType> { //rm ChartProvider
    title?: string;
    subtitle?: string;
    xtitle?: string;
    ytitle?: string; // multiple  {key: val}
    width?: number;
    height?: number;
    stacked?: boolean; //barChart only 
    pivot?: boolean; //transpose data
    continue?: boolean; //categories | [x,y]
    xorder?: Sort;
    series?: SerieProvider<X,Y>[];
    options?: any;
}

export interface SerieProvider<X extends XaxisType, Y extends YaxisType> { //rm SerieProvider
    data: CoordinateProvider<X,Y>; // | [X,Y]
    name ?: string | DataProvider<string>;
    stack?: string | DataProvider<string>; //one time at init
    color?: string | DataProvider<string>; //one time at init
    unit?: string;
    //type
}

export declare type Coordinate2D = {x: XaxisType, y: YaxisType};

export declare type XaxisType = number | string | Date;

export declare type YaxisType = number | number[];//2D

export declare type CoordinateProvider<X,Y> = {x: DataProvider<X>, y: DataProvider<Y>};

export declare type DataProvider<T> = (o: any, idx: number) => T;

export declare type Sort = 'asc' | 'desc';

export interface CommonChart<X extends XaxisType, Y extends YaxisType | Coordinate2D> {
    series: CommonSerie<Y>[];
    categories?: X[];    
    title?: string;
    subtitle?: string;
    xtitle?: string;
    ytitle?: string;
    width?: number;
    height?: number;
    pivot?: boolean; //transpose data
    continue?: boolean; //categories | [x,y]
    stacked?: boolean;
    xorder?: Sort;
    options?: any;
}

export interface CommonSerie<Y extends YaxisType | Coordinate2D> {
    data: Y[];
    name?: string;
    stack?: string;
    color?: string;
    //type
}

export function naturalFieldComparator<T>(sens: Sort, provider: DataProvider<T>) : (o1:any, o2:any)=>number {
    if(provider){
        const v = sens=='asc' ? 1 : -1; 
        return (o1,o2)=> {
            let a = provider(o1, undefined); 
            let b = provider(o2, undefined); 
            return a>b?v:a<b?-v:0;
        }
    }
    return naturalComparator(sens);
}

export function naturalComparator<T>(sens: Sort) : (o1:T, o2:T)=>number {
    const v = sens=='asc' ? 1 : -1; 
    return ((a:T,b:T)=> a>b?v:a<b?-v:0)
}

export function groupByFiled<T>(arr:[], name:string) : {[key:string]: T[]} {
    return groupBy(arr, field(name));
}

export function groupBy<T>(arr:[], fn: DataProvider<string>) : {[key:string]: T[]} {
    return arr.reduce((acc, o, idx)=>{
        var key = fn(o,idx);
        if(!acc[key]){
            acc[key] = [];
        }
        acc[key].push(o);
        return acc;
    }, {});
}

export interface ChartView<X extends XaxisType, Y extends YaxisType> {
    config: ChartProvider<X, Y>;
    data: any[];
    isLoading: boolean;
    canPivot?: boolean;
}

/*  OLD */


// export interface StackedBarChartMapper extends BarChartMapper {
//     stackField: string;
// }

// export interface BarChartMapper extends DataMapper {
//     group?: string;
// }

// export interface MultiLineChartMapper extends LineChartMapper {
//     multiField: string;
// }

// export interface LineChartMapper extends DataMapper {

// }

// export interface PieChartMapper extends DataMapper {

// }


// export interface Category<T> {
//     type: 'string' | 'number' | 'date';
//     mapper: DataProvider<T>;
// }


// export interface RowSet<T extends DataMapper> {
//     name: string;
//     data: any[];
//     mapper: T;
//     group?: string;
// }


// export function toCategoriesFn(categories?: string | string[] | ((o: any) => any)): (o: any) => any {
//     if (!categories) {
//         return o => undefined;
//     } // o=> undefined;

//     if (typeof categories === 'string') {
//         return o => o[categories];
//     } else if (Array.isArray(categories)) {
//         return o => categories.map(c => o[c]).join('_');
//     } else if (typeof categories === 'function') {
//         return categories
//     }
//     //warn
//     return o => categories;
// }


// // Gestion des exceptions ? if field does not exist
// export class DataSet<T extends DataMapper> {
//     objects: any[];
//     labels: string[];
//     colFn: (o: any) => any;

//     constructor(objects: any[], continues: boolean, dataMappers?: T[]) {
//         this.objects = objects;

//         let cols: Set<any> = new Set();
//         this.labels = [...cols];
//     }

//     order<T extends DataMapper>(compareFn?: (a: string, b: string) => number): DataSet<T> {
//         this.labels.sort(compareFn);
//         return this;
//     }

//     data<T extends DataMapper>(mappers: T[], defaultValue: any = null): RowSet<T>[] {
//         return mappers.flatMap(m => {
//             if (m['stackField'] || m['multiField']) {
//                 return this.stackedData(m, defaultValue);
//             } else {
//                 return this.simpleData(m, defaultValue);
//             }
//         });
//     }

//     simpleData<T extends DataMapper>(mapper: T, defaultValue: any = null): RowSet<T> {
//         // Fonctionne pas avec l'order
//         // console.log("simpleData", { name: mapper.label, group: mapper.group, data: this.objects.map(o => isNaN(o[mapper.field]) ? defaultValue : o[mapper.field]), mapper: mapper })
//         return { name: mapper.label, group: mapper['group'], data: mapper.field.build(this.objects, defaultValue), mapper: mapper };
//     }

//     stackedData<T extends DataMapper>(mapper: T, defaultValue: any = null): RowSet<T>[] {
//         let rowFn = toCategoriesFn(mapper['stackField'] || mapper['multiField']);
//         let map = this.objects.reduce((acc, o) => {
//             if (!acc[rowFn(o)]) {
//                 acc[rowFn(o)] = {};
//             }
//             acc[rowFn(o)][this.colFn(o)] = o[mapper.field];
//             acc[rowFn(o)]['group'] = o[mapper['group']];
//             return acc;
//         }, {});
//         console.log("stackedData", map, this.objects);
//         return Object.entries(map)
//             .map((arr: [string, any]) => {
//                 return { name: arr[0], group: arr[1]['group'], data: this.labels.map(l => isNaN(arr[1][l]) ? defaultValue : arr[1][l]), mapper: mapper }
//             });
//     }
// }

/**
 * Simple object check.
 * @param item
 * @returns {boolean}
 */
export function isObject(item: any): boolean {
    return (item && typeof item === 'object' && !Array.isArray(item));
}

/**
* Deep merge two objects.
* @param target
* @param ...sources
*/
export function mergeDeep(target: any, ...sources: any[]): any {
    if (!sources.length) return target;
    const source = sources.shift();

    if (isObject(target) && isObject(source)) {
        for (const key in source) {
            if (isObject(source[key])) {
                if (!target[key]) Object.assign(target, { [key]: {} });
                mergeDeep(target[key], source[key]);
            } else {
                Object.assign(target, { [key]: source[key] });
            }
        }
    }

    return mergeDeep(target, ...sources);
}